/**
 * Database Backup Controller
 * Full MongoDB backup/restore με mongodump/mongorestore
 * Τα tools αποθηκεύονται στο AppData για να μείνει το repo καθαρό
 */

const { exec, execSync } = require('child_process');
const { promisify } = require('util');
const execAsync = promisify(exec);
const path = require('path');
const fs = require('fs');
const https = require('https');
const AdmZip = require('adm-zip');
const os = require('os');

// Paths - Tools στο AppData, Backups/Temp στο repo
const APPDATA_DIR = path.join(os.homedir(), 'AppData', 'Local', 'FastDelivery');
const TOOLS_DIR = path.join(APPDATA_DIR, 'mongodb-tools');
const BACKUP_DIR = path.join(__dirname, '../../backups');
const TEMP_DIR = path.join(__dirname, '../../temp');
const MONGODUMP = path.join(TOOLS_DIR, 'mongodump.exe');
const MONGORESTORE = path.join(TOOLS_DIR, 'mongorestore.exe');

// MongoDB Tools download URL
const MONGO_TOOLS_URL = 'https://fastdl.mongodb.org/tools/db/mongodb-database-tools-windows-x86_64-100.9.4.zip';

// Ensure directories exist
if (!fs.existsSync(TOOLS_DIR)) fs.mkdirSync(TOOLS_DIR, { recursive: true });
if (!fs.existsSync(BACKUP_DIR)) fs.mkdirSync(BACKUP_DIR, { recursive: true });
// Only create directories on Windows
const isWindows = process.platform === 'win32';
if (isWindows) {
  if (!fs.existsSync(TOOLS_DIR)) fs.mkdirSync(TOOLS_DIR, { recursive: true });
  if (!fs.existsSync(BACKUP_DIR)) fs.mkdirSync(BACKUP_DIR, { recursive: true });
  if (!fs.existsSync(TEMP_DIR)) fs.mkdirSync(TEMP_DIR, { recursive: true });
}

/**
 * Check if MongoDB tools are installed
 */
const checkToolsInstalled = () => {
  if (!isWindows) return false;
  return fs.existsSync(MONGODUMP) && fs.existsSync(MONGORESTORE);
};

/**
 * @desc    Check MongoDB tools status
 * @route   GET /api/v1/admin/database/tools-status
 */
exports.getDatabaseToolsStatus = async (req, res) => {
  try {
    // Έλεγχος αν είναι Windows
    if (!isWindows) {
      return res.json({
        success: true,
        installed: false,
        notSupported: true,
        message: 'Το Database Backup διαθέσιμο μόνο σε Windows (development)'
      });
    }
    
    const installed = checkToolsInstalled();
    
    res.json({
      success: true,
      installed,
      message: installed ? 'MongoDB tools εγκατεστημένα' : 'MongoDB tools δεν βρέθηκαν'
    });
  } catch (error) {
    console.error('Database status error:', error);
    res.status(500).json({
      success: false,
      message: 'Σφάλμα ελέγχου κατάστασης: ' + error.message
    });
  }
};

/**
 * @desc    Install MongoDB tools (download and extract)
 * @route   POST /api/v1/admin/database/install-tools
 */
exports.installDatabaseTools = async (req, res) => {
  try {
    if (!isWindows) {
      return res.status(400).json({
        success: false,
        message: 'Η εγκατάσταση tools διαθέσιμη μόνο σε Windows'
      });
    }
    
    if (checkToolsInstalled()) {
      return res.json({
        success: true,
        message: 'Τα εργαλεία είναι ήδη εγκατεστημένα'
      });
    }
    
    const tempZip = path.join(TOOLS_DIR, 'mongo-tools.zip');
    
    // Download file
    await new Promise((resolve, reject) => {
      const download = (url) => {
        https.get(url, (response) => {
          if (response.statusCode === 301 || response.statusCode === 302) {
            download(response.headers.location);
            return;
          }
          
          const file = fs.createWriteStream(tempZip);
          response.pipe(file);
          file.on('finish', () => {
            file.close();
            resolve();
          });
        }).on('error', reject);
      };
      download(MONGO_TOOLS_URL);
    });
    
    // Use PowerShell to extract (built-in on Windows)
    execSync(`powershell -Command "Expand-Archive -Path '${tempZip}' -DestinationPath '${TOOLS_DIR}' -Force"`, {
      stdio: 'pipe'
    });
    
    // Find and copy executables to tools root
    const extractedDirs = fs.readdirSync(TOOLS_DIR).filter(f => 
      f.startsWith('mongodb-database-tools') && fs.statSync(path.join(TOOLS_DIR, f)).isDirectory()
    );
    
    if (extractedDirs.length > 0) {
      const binDir = path.join(TOOLS_DIR, extractedDirs[0], 'bin');
      if (fs.existsSync(binDir)) {
        fs.readdirSync(binDir).forEach(f => {
          fs.copyFileSync(path.join(binDir, f), path.join(TOOLS_DIR, f));
        });
      }
      // Cleanup extracted folder
      fs.rmSync(path.join(TOOLS_DIR, extractedDirs[0]), { recursive: true, force: true });
    }
    
    // Cleanup zip
    fs.rmSync(tempZip, { force: true });
    
    res.json({
      success: true,
      message: 'Τα MongoDB Database Tools εγκαταστάθηκαν επιτυχώς!'
    });
  } catch (error) {
    console.error('Install tools error:', error);
    res.status(500).json({
      success: false,
      message: 'Σφάλμα εγκατάστασης εργαλείων: ' + error.message
    });
  }
};

/**
 * @desc    Create database backup and send as ZIP
 * @route   POST /api/v1/admin/database/backup
 */
exports.createDatabaseBackup = async (req, res) => {
  let backupPath = null;
  let zipPath = null;
  
  try {
    if (!isWindows) {
      return res.status(400).json({
        success: false,
        message: 'Το Database Backup διαθέσιμο μόνο σε Windows (development)'
      });
    }
    
    if (!checkToolsInstalled()) {
      return res.status(400).json({
        success: false,
        message: 'Τα MongoDB tools δεν είναι εγκατεστημένα. Εγκαταστήστε τα πρώτα.'
      });
    }
    
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
    const backupName = `backup-${timestamp}`;
    backupPath = path.join(BACKUP_DIR, backupName);
    zipPath = path.join(BACKUP_DIR, `${backupName}.zip`);
    
    // Run mongodump using async exec (doesn't block event loop)
    const dumpCommand = `"${MONGODUMP}" --uri="${process.env.MONGODB_URI}" --out="${backupPath}"`;
    
    try {
      await execAsync(dumpCommand, { 
        maxBuffer: 50 * 1024 * 1024,  // 50MB buffer
        timeout: 120000  // 2 minute timeout
      });
    } catch (dumpError) {
      throw new Error('Αποτυχία mongodump: ' + dumpError.message);
    }
    
    // Check if backup was created
    if (!fs.existsSync(backupPath)) {
      throw new Error('Η δημιουργία backup απέτυχε - δεν βρέθηκε φάκελος');
    }
    
    // Create ZIP using AdmZip (synchronous but fast)
    const zip = new AdmZip();
    zip.addLocalFolder(backupPath);
    zip.writeZip(zipPath);
    
    // Get ZIP size
    const stats = fs.statSync(zipPath);
    
    // Cleanup backup folder immediately (keep only zip)
    fs.rmSync(backupPath, { recursive: true, force: true });
    backupPath = null;
    
    // Send file
    res.setHeader('Content-Type', 'application/zip');
    res.setHeader('Content-Disposition', `attachment; filename="${backupName}.zip"`);
    res.setHeader('Content-Length', stats.size);
    
    const fileStream = fs.createReadStream(zipPath);
    
    fileStream.on('error', (err) => {
      console.error('File stream error:', err);
      if (zipPath && fs.existsSync(zipPath)) {
        fs.rmSync(zipPath, { force: true });
      }
    });
    
    fileStream.on('close', () => {
      if (zipPath && fs.existsSync(zipPath)) {
        fs.rmSync(zipPath, { force: true });
      }
    });
    
    fileStream.pipe(res);
    
  } catch (error) {
    console.error('Backup error:', error);
    
    // Cleanup on error
    if (backupPath && fs.existsSync(backupPath)) {
      fs.rmSync(backupPath, { recursive: true, force: true });
    }
    if (zipPath && fs.existsSync(zipPath)) {
      fs.rmSync(zipPath, { force: true });
    }
    
    // Only send error if headers haven't been sent
    if (!res.headersSent) {
      res.status(500).json({
        success: false,
        message: 'Σφάλμα δημιουργίας backup: ' + error.message
      });
    }
  }
};

/**
 * @desc    Restore database from uploaded ZIP backup
 * @route   POST /api/v1/admin/database/restore
 */
exports.restoreDatabase = async (req, res) => {
  let extractPath = null;
  
  try {
    if (!isWindows) {
      return res.status(400).json({
        success: false,
        message: 'Το Database Restore διαθέσιμο μόνο σε Windows (development)'
      });
    }
    
    if (!checkToolsInstalled()) {
      return res.status(400).json({
        success: false,
        message: 'Τα MongoDB tools δεν είναι εγκατεστημένα'
      });
    }
    
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'Δεν ανέβηκε αρχείο backup'
      });
    }
    
    const timestamp = Date.now();
    extractPath = path.join(TEMP_DIR, `restore-${timestamp}`);
    
    // Extract ZIP using adm-zip
    const zip = new AdmZip(req.file.path);
    zip.extractAllTo(extractPath, true);
    
    // Find the fast_delivery folder
    let dbFolder = null;
    const findDbFolder = (dir) => {
      const items = fs.readdirSync(dir);
      if (items.includes('fast_delivery')) {
        dbFolder = path.join(dir, 'fast_delivery');
        return;
      }
      for (const item of items) {
        const itemPath = path.join(dir, item);
        if (fs.statSync(itemPath).isDirectory()) {
          findDbFolder(itemPath);
          if (dbFolder) return;
        }
      }
    };
    findDbFolder(extractPath);
    
    if (!dbFolder) {
      // Cleanup
      fs.rmSync(extractPath, { recursive: true, force: true });
      fs.rmSync(req.file.path, { force: true });
      
      return res.status(400).json({
        success: false,
        message: 'Δεν βρέθηκε φάκελος fast_delivery στο backup'
      });
    }
    
    // Run mongorestore using async exec
    const restoreCommand = `"${MONGORESTORE}" --uri="${process.env.MONGODB_URI}" --drop "${dbFolder}"`;
    
    try {
      await execAsync(restoreCommand, {
        maxBuffer: 50 * 1024 * 1024,
        timeout: 300000  // 5 minute timeout for restore
      });
    } catch (restoreError) {
      throw new Error('Αποτυχία mongorestore: ' + restoreError.message);
    }
    
    // Cleanup
    fs.rmSync(extractPath, { recursive: true, force: true });
    fs.rmSync(req.file.path, { force: true });
    
    res.json({
      success: true,
      message: 'Η βάση δεδομένων επαναφέρθηκε επιτυχώς!'
    });
  } catch (error) {
    console.error('Restore error:', error);
    // Cleanup on error
    if (extractPath && fs.existsSync(extractPath)) {
      fs.rmSync(extractPath, { recursive: true, force: true });
    }
    if (req.file && fs.existsSync(req.file.path)) {
      fs.rmSync(req.file.path, { force: true });
    }
    res.status(500).json({
      success: false,
      message: 'Σφάλμα επαναφοράς: ' + error.message
    });
  }
};

/**
 * @desc    Delete backup
 * @route   DELETE /api/v1/admin/database/backup
 */
exports.deleteBackup = async (req, res) => {
  try {
    const { backupName } = req.body;
    
    if (!backupName) {
      return res.status(400).json({
        success: false,
        message: 'Δεν δόθηκε όνομα backup'
      });
    }
    
    const backupPath = path.join(BACKUP_DIR, backupName);
    
    if (fs.existsSync(backupPath)) {
      fs.rmSync(backupPath, { recursive: true, force: true });
    }
    
    const zipPath = path.join(BACKUP_DIR, `${backupName}.zip`);
    if (fs.existsSync(zipPath)) {
      fs.rmSync(zipPath, { force: true });
    }
    
    res.json({
      success: true,
      message: 'Το backup διαγράφηκε'
    });
  } catch (error) {
    console.error('Delete backup error:', error);
    res.status(500).json({
      success: false,
      message: 'Σφάλμα διαγραφής: ' + error.message
    });
  }
};
