import React, { useState, useEffect, useCallback } from 'react';
import { 
  Card, 
  Row, 
  Col, 
  Form, 
  Button, 
  Spinner, 
  Alert,
  InputGroup,
  Table,
  Badge,
  ProgressBar
} from 'react-bootstrap';
import { 
  FaChartLine, 
  FaEuroSign, 
  FaMoneyBillWave,
  FaUsers,
  FaStore,
  FaMotorcycle,
  FaCalendarAlt,
  FaStickyNote,
  FaSave,
  FaShoppingBag,
  FaTrophy,
  FaArrowUp,
  FaArrowDown,
  FaClock
} from 'react-icons/fa';
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell
} from 'recharts';
import api from '../../services/api';

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8'];
const MONTHS_GR = [
  'Ιανουάριος', 'Φεβρουάριος', 'Μάρτιος', 'Απρίλιος', 
  'Μάιος', 'Ιούνιος', 'Ιούλιος', 'Αύγουστος',
  'Σεπτέμβριος', 'Οκτώβριος', 'Νοέμβριος', 'Δεκέμβριος'
];

const StatisticsTab = () => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  
  // Date selection
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth() + 1);
  
  // Stats data
  const [stats, setStats] = useState(null);
  
  // Monthly expenses form
  const [expenseAmount, setExpenseAmount] = useState(0);
  const [expenseNotes, setExpenseNotes] = useState('');
  const [savingExpenses, setSavingExpenses] = useState(false);

  // Fetch stats
  const fetchStats = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      
      const res = await api.get(`/admin/stats/extended?year=${selectedYear}&month=${selectedMonth}`);
      
      if (res.data.success) {
        setStats(res.data.stats);
        setExpenseAmount(res.data.stats.financial.extraExpenses || 0);
        setExpenseNotes(res.data.stats.financial.expenseNotes || '');
      }
    } catch (err) {
      console.error('Error fetching stats:', err);
      setError('Σφάλμα φόρτωσης στατιστικών');
    } finally {
      setLoading(false);
    }
  }, [selectedYear, selectedMonth]);

  useEffect(() => {
    fetchStats();
  }, [fetchStats]);

  // Save monthly expenses
  const handleSaveExpenses = async () => {
    try {
      setSavingExpenses(true);
      setError(null);
      
      const res = await api.put(`/admin/expenses/${selectedYear}/${selectedMonth}`, {
        amount: parseFloat(expenseAmount) || 0,
        notes: expenseNotes
      });
      
      if (res.data.success) {
        setSuccess('Τα έξοδα αποθηκεύτηκαν!');
        setTimeout(() => setSuccess(null), 3000);
        fetchStats(); // Refresh to update net result
      }
    } catch (err) {
      console.error('Error saving expenses:', err);
      setError(err.response?.data?.message || 'Σφάλμα αποθήκευσης εξόδων');
    } finally {
      setSavingExpenses(false);
    }
  };

  // Generate years for dropdown
  const years = [];
  const currentYear = new Date().getFullYear();
  for (let y = currentYear - 2; y <= currentYear + 1; y++) {
    years.push(y);
  }

  // Format currency
  const formatCurrency = (value) => {
    return new Intl.NumberFormat('el-GR', {
      style: 'currency',
      currency: 'EUR'
    }).format(value);
  };

  // Prepare chart data
  const prepareMonthlyData = () => {
    if (!stats?.charts?.revenuePerMonth) return [];
    
    return stats.charts.revenuePerMonth.map(item => ({
      month: MONTHS_GR[item._id - 1]?.substring(0, 3) || item._id,
      revenue: item.revenue,
      orders: item.orders
    }));
  };

  const prepareDailyData = () => {
    if (!stats?.charts?.ordersPerDay) return [];
    
    return stats.charts.ordersPerDay.map(item => ({
      day: item._id,
      orders: item.count,
      revenue: item.revenue
    }));
  };

  if (loading) {
    return (
      <div className="text-center py-5">
        <Spinner animation="border" variant="primary" />
        <p className="mt-2">Φόρτωση στατιστικών...</p>
      </div>
    );
  }

  return (
    <>
      {error && (
        <Alert variant="danger" onClose={() => setError(null)} dismissible>
          {error}
        </Alert>
      )}
      
      {success && (
        <Alert variant="success" onClose={() => setSuccess(null)} dismissible>
          {success}
        </Alert>
      )}

      {/* Month/Year Selection */}
      <Card className="shadow-sm mb-4">
        <Card.Body>
          <Row className="align-items-center">
            <Col md={3}>
              <Form.Group>
                <Form.Label><FaCalendarAlt className="me-2" />Μήνας</Form.Label>
                <Form.Select 
                  value={selectedMonth}
                  onChange={(e) => setSelectedMonth(parseInt(e.target.value))}
                >
                  {MONTHS_GR.map((month, index) => (
                    <option key={index + 1} value={index + 1}>{month}</option>
                  ))}
                </Form.Select>
              </Form.Group>
            </Col>
            <Col md={3}>
              <Form.Group>
                <Form.Label><FaCalendarAlt className="me-2" />Έτος</Form.Label>
                <Form.Select 
                  value={selectedYear}
                  onChange={(e) => setSelectedYear(parseInt(e.target.value))}
                >
                  {years.map(year => (
                    <option key={year} value={year}>{year}</option>
                  ))}
                </Form.Select>
              </Form.Group>
            </Col>
            <Col md={6}>
              <div className="text-end">
                <h4 className="mb-0 text-primary">
                  {MONTHS_GR[selectedMonth - 1]} {selectedYear}
                </h4>
              </div>
            </Col>
          </Row>
        </Card.Body>
      </Card>

      {/* Financial Summary */}
      <Row className="mb-4">
        <Col md={3}>
          <Card className="shadow-sm h-100 border-info" style={{ borderWidth: '2px' }}>
            <Card.Body className="text-center">
              <FaClock className="text-info mb-2" size={30} />
              <h6 className="text-muted">Ημερήσιος Τζίρος (Σήμερα)</h6>
              <h3 className="text-info">
                {formatCurrency(stats?.today?.revenue || 0)}
              </h3>
              <small className="text-muted">
                {stats?.today?.orders || 0} παραγγελίες
              </small>
            </Card.Body>
          </Card>
        </Col>
        <Col md={3}>
          <Card className="shadow-sm h-100 border-success">
            <Card.Body className="text-center">
              <FaEuroSign className="text-success mb-2" size={30} />
              <h6 className="text-muted">Έσοδα Μήνα (Delivery)</h6>
              <h3 className="text-success">
                {formatCurrency(stats?.financial?.revenue || 0)}
              </h3>
            </Card.Body>
          </Card>
        </Col>
        <Col md={2}>
          <Card className="shadow-sm h-100 border-warning">
            <Card.Body className="text-center">
              <FaMotorcycle className="text-warning mb-2" size={24} />
              <h6 className="text-muted small">Μισθοί</h6>
              <h4 className="text-warning">
                {formatCurrency(stats?.financial?.totalSalaries || 0)}
              </h4>
              <small className="text-muted" style={{ fontSize: '0.7rem' }}>
                {stats?.financial?.approvedDrivers || 0} × {formatCurrency(stats?.financial?.driverSalary || 0)}
              </small>
            </Card.Body>
          </Card>
        </Col>
        <Col md={2}>
          <Card className="shadow-sm h-100 border-danger">
            <Card.Body className="text-center">
              <FaMoneyBillWave className="text-danger mb-2" size={24} />
              <h6 className="text-muted small">Έξοδα</h6>
              <h4 className="text-danger">
                {formatCurrency(stats?.financial?.extraExpenses || 0)}
              </h4>
            </Card.Body>
          </Card>
        </Col>
        <Col md={2}>
          <Card className={`shadow-sm h-100 border-${(stats?.financial?.netResult || 0) >= 0 ? 'primary' : 'danger'}`}>
            <Card.Body className="text-center">
              {(stats?.financial?.netResult || 0) >= 0 ? (
                <FaArrowUp className="text-primary mb-2" size={24} />
              ) : (
                <FaArrowDown className="text-danger mb-2" size={24} />
              )}
              <h6 className="text-muted small">Καθαρό</h6>
              <h4 className={(stats?.financial?.netResult || 0) >= 0 ? 'text-primary' : 'text-danger'}>
                {formatCurrency(stats?.financial?.netResult || 0)}
              </h4>
            </Card.Body>
          </Card>
        </Col>
      </Row>

      {/* Monthly Expenses Form */}
      <Card className="shadow-sm mb-4 border-danger">
        <Card.Header className="bg-danger text-white">
          <FaMoneyBillWave className="me-2" />
          Έκτακτα Έξοδα Μήνα - {MONTHS_GR[selectedMonth - 1]} {selectedYear}
        </Card.Header>
        <Card.Body>
          <Row>
            <Col md={4}>
              <Form.Group>
                <Form.Label>Ποσό Εξόδων</Form.Label>
                <InputGroup>
                  <Form.Control
                    type="number"
                    value={expenseAmount}
                    onChange={(e) => setExpenseAmount(e.target.value)}
                    min="0"
                    step="10"
                  />
                  <InputGroup.Text><FaEuroSign /></InputGroup.Text>
                </InputGroup>
              </Form.Group>
            </Col>
            <Col md={6}>
              <Form.Group>
                <Form.Label><FaStickyNote className="me-2" />Σημειώσεις</Form.Label>
                <Form.Control
                  type="text"
                  placeholder="π.χ. Συντήρηση οχημάτων, Διαφήμιση, κλπ."
                  value={expenseNotes}
                  onChange={(e) => setExpenseNotes(e.target.value)}
                />
              </Form.Group>
            </Col>
            <Col md={2} className="d-flex align-items-end">
              <Button 
                variant="danger" 
                className="w-100"
                onClick={handleSaveExpenses}
                disabled={savingExpenses}
              >
                {savingExpenses ? (
                  <Spinner size="sm" animation="border" />
                ) : (
                  <><FaSave className="me-1" /> Αποθήκευση</>
                )}
              </Button>
            </Col>
          </Row>
        </Card.Body>
      </Card>

      {/* Charts Row */}
      <Row className="mb-4">
        {/* Daily Orders Chart */}
        <Col lg={6}>
          <Card className="shadow-sm h-100">
            <Card.Header className="bg-primary text-white">
              <FaChartLine className="me-2" />
              Παραγγελίες ανά Ημέρα - {MONTHS_GR[selectedMonth - 1]}
            </Card.Header>
            <Card.Body>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={prepareDailyData()}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="day" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="orders" name="Παραγγελίες" fill="#0088FE" />
                </BarChart>
              </ResponsiveContainer>
            </Card.Body>
          </Card>
        </Col>

        {/* Monthly Revenue Chart */}
        <Col lg={6}>
          <Card className="shadow-sm h-100">
            <Card.Header className="bg-success text-white">
              <FaEuroSign className="me-2" />
              Έσοδα ανά Μήνα - {selectedYear}
            </Card.Header>
            <Card.Body>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={prepareMonthlyData()}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="month" />
                  <YAxis />
                  <Tooltip formatter={(value) => formatCurrency(value)} />
                  <Legend />
                  <Line 
                    type="monotone" 
                    dataKey="revenue" 
                    name="Έσοδα" 
                    stroke="#00C49F" 
                    strokeWidth={2}
                    dot={{ r: 4 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </Card.Body>
          </Card>
        </Col>
      </Row>

      {/* Averages */}
      <Row className="mb-4">
        <Col md={6}>
          <Card className="shadow-sm">
            <Card.Body>
              <Row>
                <Col>
                  <h6 className="text-muted">Μέση Αξία Παραγγελίας</h6>
                  <h4>{formatCurrency(stats?.averages?.orderValue || 0)}</h4>
                </Col>
                <Col>
                  <h6 className="text-muted">Μέσο Κόστος Παράδοσης</h6>
                  <h4>{formatCurrency(stats?.averages?.deliveryFee || 0)}</h4>
                </Col>
              </Row>
            </Card.Body>
          </Card>
        </Col>
      </Row>

      {/* Top Performers */}
      <Row>
        {/* Top Stores */}
        <Col lg={4}>
          <Card className="shadow-sm h-100">
            <Card.Header className="bg-info text-white">
              <FaTrophy className="me-2" />
              Top Καταστήματα
            </Card.Header>
            <Card.Body>
              {stats?.topPerformers?.stores?.length > 0 ? (
                <Table size="sm" hover>
                  <thead>
                    <tr>
                      <th>#</th>
                      <th>Κατάστημα</th>
                      <th>Παραγγελίες</th>
                    </tr>
                  </thead>
                  <tbody>
                    {stats.topPerformers.stores.map((store, index) => (
                      <tr key={index}>
                        <td>
                          <Badge bg={index === 0 ? 'warning' : index === 1 ? 'secondary' : 'dark'}>
                            {index + 1}
                          </Badge>
                        </td>
                        <td>{store.storeName}</td>
                        <td>{store.orderCount}</td>
                      </tr>
                    ))}
                  </tbody>
                </Table>
              ) : (
                <p className="text-muted text-center">Δεν υπάρχουν δεδομένα</p>
              )}
            </Card.Body>
          </Card>
        </Col>

        {/* Top Drivers */}
        <Col lg={4}>
          <Card className="shadow-sm h-100">
            <Card.Header className="bg-warning text-dark">
              <FaMotorcycle className="me-2" />
              Top Διανομείς
            </Card.Header>
            <Card.Body>
              {stats?.topPerformers?.drivers?.length > 0 ? (
                <Table size="sm" hover>
                  <thead>
                    <tr>
                      <th>#</th>
                      <th>Διανομέας</th>
                      <th>Παραδόσεις</th>
                    </tr>
                  </thead>
                  <tbody>
                    {stats.topPerformers.drivers.map((driver, index) => (
                      <tr key={index}>
                        <td>
                          <Badge bg={index === 0 ? 'warning' : index === 1 ? 'secondary' : 'dark'}>
                            {index + 1}
                          </Badge>
                        </td>
                        <td>{driver.driverName}</td>
                        <td>{driver.deliveries}</td>
                      </tr>
                    ))}
                  </tbody>
                </Table>
              ) : (
                <p className="text-muted text-center">Δεν υπάρχουν δεδομένα</p>
              )}
            </Card.Body>
          </Card>
        </Col>

        {/* Top Customers */}
        <Col lg={4}>
          <Card className="shadow-sm h-100">
            <Card.Header className="bg-success text-white">
              <FaUsers className="me-2" />
              Top Πελάτες
            </Card.Header>
            <Card.Body>
              {stats?.topPerformers?.customers?.length > 0 ? (
                <Table size="sm" hover>
                  <thead>
                    <tr>
                      <th>#</th>
                      <th>Πελάτης</th>
                      <th>Παραγγελίες</th>
                    </tr>
                  </thead>
                  <tbody>
                    {stats.topPerformers.customers.map((customer, index) => (
                      <tr key={index}>
                        <td>
                          <Badge bg={index === 0 ? 'warning' : index === 1 ? 'secondary' : 'dark'}>
                            {index + 1}
                          </Badge>
                        </td>
                        <td>{customer.name}</td>
                        <td>{customer.orderCount}</td>
                      </tr>
                    ))}
                  </tbody>
                </Table>
              ) : (
                <p className="text-muted text-center">Δεν υπάρχουν δεδομένα</p>
              )}
            </Card.Body>
          </Card>
        </Col>
      </Row>
    </>
  );
};

export default StatisticsTab;
