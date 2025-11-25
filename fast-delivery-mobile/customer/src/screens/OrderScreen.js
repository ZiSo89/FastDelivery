import React, { useState, useEffect, useRef } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert, ScrollView, Image, KeyboardAvoidingView, Platform, Keyboard } from 'react-native';
import { customerService } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { Ionicons } from '@expo/vector-icons';
import { Audio } from 'expo-av';

const OrderScreen = ({ route, navigation }) => {
  const { store } = route.params;
  const { user } = useAuth();
  const [orderText, setOrderText] = useState('');
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [address, setAddress] = useState('');
  const [loading, setLoading] = useState(false);
  const [isEditingDetails, setIsEditingDetails] = useState(false);
  
  // Voice recording states
  const [recordedUri, setRecordedUri] = useState(null);
  const [isRecording, setIsRecording] = useState(false);
  const [recordingDuration, setRecordingDuration] = useState(0);
  const [sound, setSound] = useState(null);
  const [isPlaying, setIsPlaying] = useState(false);
  
  // Refs for robust recording handling
  const recordingRef = useRef(null);
  const isRecordingRef = useRef(false);
  const startRecordingTimeoutRef = useRef(null);
  const scrollViewRef = useRef(null);

  useEffect(() => {
    const keyboardDidShowListener = Keyboard.addListener(
      'keyboardDidShow',
      () => {
        setTimeout(() => {
          scrollViewRef.current?.scrollToEnd({ animated: true });
        }, 100);
      }
    );

    return () => {
      keyboardDidShowListener.remove();
    };
  }, []);

  useEffect(() => {
    if (user) {
      setName(user.name || '');
      setPhone(user.phone || '');
      setAddress(user.address || '');
    }
    
    // Cleanup on unmount
    return () => {
      if (recordingRef.current) {
        try {
          recordingRef.current.stopAndUnloadAsync();
        } catch (e) {
          console.log('Cleanup error:', e);
        }
      }
      if (sound) {
        try {
          sound.unloadAsync();
        } catch (e) {
          console.log('Sound cleanup error:', e);
        }
      }
    };
  }, [user, sound]);

  // Timer for recording duration
  useEffect(() => {
    let interval;
    if (isRecording) {
      interval = setInterval(() => {
        setRecordingDuration(prev => {
          if (prev >= 50) {
            stopRecording();
            return 50;
          }
          return prev + 1;
        });
      }, 1000);
    } else {
      setRecordingDuration(0);
    }
    return () => clearInterval(interval);
  }, [isRecording]);

  const startRecording = () => {
    if (startRecordingTimeoutRef.current) clearTimeout(startRecordingTimeoutRef.current);

    startRecordingTimeoutRef.current = setTimeout(async () => {
      try {
        const permission = await Audio.requestPermissionsAsync();
        if (permission.status !== 'granted') {
          Alert.alert('Άδεια', 'Απαιτείται άδεια μικροφώνου για ηχογράφηση.');
          return;
        }

        // Prevent multiple starts
        if (isRecordingRef.current) return;
        
        isRecordingRef.current = true;
        setIsRecording(true);

        // Ensure any previous recording is unloaded
        if (recordingRef.current) {
          try {
            await recordingRef.current.stopAndUnloadAsync();
          } catch (e) {
            console.log('Unload error:', e);
          }
          recordingRef.current = null;
        }

        await Audio.setAudioModeAsync({
          allowsRecordingIOS: true,
          playsInSilentModeIOS: true,
        });

        const { recording: newRecording } = await Audio.Recording.createAsync(
          Audio.RecordingOptionsPresets.HIGH_QUALITY
        );
        
        // Check if user released button during initialization
        if (!isRecordingRef.current) {
          await newRecording.stopAndUnloadAsync();
          return;
        }

        recordingRef.current = newRecording;
      } catch (err) {
        console.error('Failed to start recording', err);
        setIsRecording(false);
        isRecordingRef.current = false;
        Alert.alert('Σφάλμα', 'Πρόβλημα κατά την εκκίνηση της ηχογράφησης');
      }
    }, 200);
  };

  const stopRecording = async () => {
    // If user releases before timeout, cancel the start
    if (startRecordingTimeoutRef.current) {
      clearTimeout(startRecordingTimeoutRef.current);
      startRecordingTimeoutRef.current = null;
    }

    if (!isRecordingRef.current) return;
    
    isRecordingRef.current = false;
    setIsRecording(false);

    try {
      const recording = recordingRef.current;
      if (recording) {
        try {
          await recording.stopAndUnloadAsync();
          const uri = recording.getURI();
          // Optional: check duration if available, but usually stopAndUnloadAsync throws if empty
          setRecordedUri(uri);
        } catch (error) {
          // Ignore "no valid audio data" error for short taps
          if (error.message && error.message.includes('no valid audio data')) {
            console.log('Recording too short/empty');
          } else {
            console.error('Recording stop error:', error);
          }
          setRecordedUri(null);
        }
        recordingRef.current = null;
      }
    } catch (err) {
      console.error('Failed to stop recording wrapper', err);
    }
  };

  const playRecording = async () => {
    try {
      if (sound) {
        if (isPlaying) {
          await sound.pauseAsync();
          setIsPlaying(false);
        } else {
          await sound.playAsync();
          setIsPlaying(true);
        }
        return;
      }

      const { sound: newSound } = await Audio.Sound.createAsync(
        { uri: recordedUri },
        { shouldPlay: true, isLooping: false }
      );
      
      setSound(newSound);
      setIsPlaying(true);

      newSound.setOnPlaybackStatusUpdate((status) => {
        if (status.didJustFinish) {
          setIsPlaying(false);
          // Explicitly stop to prevent any looping behavior
          newSound.stopAsync();
        }
      });
    } catch (error) {
      console.error('Playback failed', error);
      Alert.alert('Σφάλμα', 'Δεν ήταν δυνατή η αναπαραγωγή');
    }
  };

  const clearRecording = async () => {
    if (sound) {
      try {
        await sound.unloadAsync();
      } catch (e) {
        console.log('Error unloading sound:', e);
      }
      setSound(null);
    }
    setRecordedUri(null);
    setRecordingDuration(0);
    setIsPlaying(false);
  };

  const handleSubmit = async () => {
    if ((!orderText && !recordedUri) || !name || !phone || !address) {
      Alert.alert('Σφάλμα', 'Παρακαλώ συμπληρώστε τα στοιχεία και το περιεχόμενο της παραγγελίας');
      return;
    }

    setLoading(true);
    try {
      const formData = new FormData();
      formData.append('storeId', store._id);
      formData.append('orderType', recordedUri ? 'voice' : 'text');
      formData.append('orderContent', orderText || (recordedUri ? 'Ηχητική παραγγελία' : ''));
      
      const customerData = {
        name,
        phone,
        address,
        email: user?.email || null,
        location: user?.location || null
      };
      formData.append('customer', JSON.stringify(customerData));
      formData.append('isGuest', (user?.isGuest || !user).toString());

      if (recordedUri) {
        const filename = recordedUri.split('/').pop();
        const match = /\.(\w+)$/.exec(filename);
        const type = match ? `audio/${match[1]}` : 'audio/m4a';
        
        formData.append('voiceFile', {
          uri: recordedUri,
          name: filename,
          type
        });
      }

      const response = await customerService.createOrder(formData);
      const orderNumber = response.data.order?.orderNumber || response.data.orderNumber;

      Alert.alert(
        'Επιτυχία', 
        `Η παραγγελία #${orderNumber} καταχωρήθηκε!`,
        [
          { text: 'OK', onPress: () => navigation.navigate('TrackOrder', { orderNumber: orderNumber }) }
        ]
      );
    } catch (error) {
      console.log(error);
      Alert.alert('Σφάλμα', error.response?.data?.message || 'Κάτι πήγε στραβά');
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView 
      style={{ flex: 1 }}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 64 : 0}
    >
      <ScrollView 
        ref={scrollViewRef}
        contentContainerStyle={styles.scrollContainer}
        keyboardShouldPersistTaps="handled"
      >
        {/* Store Details Card */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Στοιχεία Καταστήματος</Text>
          <View style={styles.infoRow}>
            <Ionicons name="storefront-outline" size={18} color="#666" />
            <Text style={styles.infoTextBold}>{store.businessName}</Text>
          </View>
          <View style={styles.infoRow}>
            <Ionicons name="restaurant-outline" size={18} color="#666" />
            <Text style={styles.infoText}>{store.storeType || 'Κατάστημα'}</Text>
          </View>
          <View style={styles.infoRow}>
            <Ionicons name="location-outline" size={18} color="#666" />
            <Text style={styles.infoText}>{store.address}</Text>
          </View>
          <View style={styles.infoRow}>
            <Ionicons name="call-outline" size={18} color="#666" />
            <Text style={styles.infoText}>{store.phone}</Text>
          </View>
        </View>

        {/* Customer Details Card */}
        <View style={styles.card}>
          <View style={styles.cardHeaderRow}>
            <Text style={styles.cardTitle}>Στοιχεία Πελάτη</Text>
            <TouchableOpacity onPress={() => setIsEditingDetails(!isEditingDetails)}>
              <Text style={styles.editLink}>{isEditingDetails ? 'Ολοκλήρωση' : 'Αλλαγή στοιχείων'}</Text>
            </TouchableOpacity>
          </View>

          {isEditingDetails ? (
            <View style={styles.editForm}>
              <TextInput
                style={styles.input}
                placeholder="Ονοματεπώνυμο"
                value={name}
                onChangeText={setName}
              />
              <TextInput
                style={styles.input}
                placeholder="Τηλέφωνο"
                keyboardType="phone-pad"
                value={phone}
                onChangeText={setPhone}
              />
              <TextInput
                style={styles.input}
                placeholder="Διεύθυνση"
                value={address}
                onChangeText={setAddress}
              />
            </View>
          ) : (
            <View style={styles.customerInfo}>
              <View style={styles.infoRow}>
                <Ionicons name="person-outline" size={18} color="#666" />
                <Text style={styles.infoTextBold}>{name || 'Όνομα Πελάτη'}</Text>
              </View>
              <View style={styles.infoRow}>
                <Ionicons name="call-outline" size={18} color="#666" />
                <Text style={styles.infoText}>{phone || 'Τηλέφωνο'}</Text>
              </View>
              <View style={styles.infoRow}>
                <Ionicons name="location-outline" size={18} color="#666" />
                <Text style={styles.infoText}>{address || 'Διεύθυνση'}</Text>
              </View>
            </View>
          )}
        </View>

        {/* Main Voice Section - Centered & Prominent */}
        <View style={styles.voiceSection}>
          {!recordedUri ? (
            <View style={styles.micContainer}>
              <TouchableOpacity 
                style={[styles.micButton, isRecording && styles.micButtonRecording]}
                onPressIn={startRecording}
                onPressOut={stopRecording}
                activeOpacity={0.8}
              >
                <Ionicons name="mic" size={40} color="#fff" />
              </TouchableOpacity>
              <Text style={styles.voiceHint}>
                {isRecording ? `Ηχογράφηση... ${recordingDuration}s` : 'Πατήστε παρατεταμένα'}
              </Text>
            </View>
          ) : (
            <View style={styles.playbackContainer}>
              <TouchableOpacity style={styles.playButton} onPress={playRecording}>
                <Ionicons name={isPlaying ? "pause" : "play"} size={32} color="#fff" />
              </TouchableOpacity>
              <View style={styles.playbackInfo}>
                <Text style={styles.playbackText}>Ηχητικό μήνυμα</Text>
                <TouchableOpacity onPress={clearRecording}>
                  <Text style={styles.deleteText}>Διαγραφή</Text>
                </TouchableOpacity>
              </View>
            </View>
          )}
        </View>

        {/* Bottom Section: Input & Submit */}
        <View style={styles.bottomSection}>
          <TextInput
            style={styles.compactTextArea}
            multiline
            placeholder="Προσθέστε σχόλια ή γράψτε την παραγγελία σας..."
            value={orderText}
            onChangeText={setOrderText}
            editable={!isRecording}
          />
          
          <TouchableOpacity 
            style={[styles.submitButton, loading && styles.submitButtonDisabled]}
            onPress={handleSubmit}
            disabled={loading}
          >
            <Text style={styles.submitButtonText}>
              {loading ? 'Αποστολή...' : 'Αποστολή Παραγγελίας'}
            </Text>
            <Ionicons name="send" size={20} color="#fff" style={{marginLeft: 8}} />
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  scrollContainer: {
    flexGrow: 1,
    backgroundColor: '#f0f2f5',
    padding: 16,
    paddingTop: 10,
    paddingBottom: 100,
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 12,
    marginBottom: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 1,
  },
  cardHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  cardTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#888',
    marginBottom: 8,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
    gap: 10,
  },
  infoText: {
    fontSize: 14,
    color: '#444',
    flex: 1,
  },
  infoTextBold: {
    fontSize: 15,
    fontWeight: '600',
    color: '#1a1a1a',
    flex: 1,
  },
  editLink: {
    color: '#00c1e8',
    fontWeight: '600',
    fontSize: 13,
  },
  editForm: {
    gap: 8,
  },
  input: {
    backgroundColor: '#f9f9f9',
    borderWidth: 1,
    borderColor: '#eee',
    borderRadius: 8,
    padding: 8,
    fontSize: 14,
  },
  customerInfo: {
    gap: 2,
  },
  voiceSection: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    minHeight: 150,
  },
  micContainer: {
    alignItems: 'center',
  },
  micButton: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#00c1e8',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#00c1e8',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
    elevation: 8,
    marginBottom: 16,
  },
  micButtonRecording: {
    backgroundColor: '#e74c3c',
    transform: [{ scale: 1.1 }],
  },
  voiceHint: {
    color: '#888',
    fontSize: 14,
    fontWeight: '500',
  },
  playbackContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    padding: 12,
    borderRadius: 50,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
    width: '80%',
  },
  playButton: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: '#00c1e8',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  playbackInfo: {
    flex: 1,
  },
  playbackText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 4,
  },
  deleteText: {
    color: '#e74c3c',
    fontSize: 13,
    fontWeight: '500',
  },
  bottomSection: {
    gap: 12,
  },
  compactTextArea: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 16,
    height: 80,
    textAlignVertical: 'top',
    fontSize: 15,
    color: '#333',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 5,
    elevation: 1,
  },
  submitButton: {
    backgroundColor: '#00c1e8',
    borderRadius: 16,
    paddingVertical: 16,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#00c1e8',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  submitButtonDisabled: {
    backgroundColor: '#b2ebf2',
    shadowOpacity: 0,
  },
  submitButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
});

export default OrderScreen;
