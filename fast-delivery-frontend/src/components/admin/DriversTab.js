import React, { useState, useEffect, useCallback } from 'react';
import { Table, Button, Badge, Spinner, Alert, ButtonGroup, Card, Row, Col, Pagination } from 'react-bootstrap';
import { adminService } from '../../services/api';
import socketService from '../../services/socket';
import AlertModal from '../AlertModal';

const DriversTab = () => {
  const [drivers, setDrivers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [filter, setFilter] = useState('approved');
  const [processingId, setProcessingId] = useState(null);
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);
  const [alertModal, setAlertModal] = useState({ show: false, variant: 'success', message: '' });
  
  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const itemsPerPage = 20;

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const fetchDrivers = useCallback(async (page = currentPage) => {
    try {
      setLoading(true);
      const response = await adminService.getDrivers(filter === 'all' ? null : filter, null, page, itemsPerPage);
      setDrivers(response.drivers || []);
      setTotalPages(response.totalPages || 1);
      setTotalCount(response.totalCount || 0);
      setCurrentPage(response.currentPage || page);
      setError('');
    } catch (err) {
      setError(err.response?.data?.message || 'Σφάλμα φόρτωσης οδηγών');
    } finally {
      setLoading(false);
    }
  }, [filter, currentPage]);

  useEffect(() => {
    setCurrentPage(1);
    fetchDrivers(1);
    
    // Socket.IO listener for driver online/offline status changes
    const handleDriverStatusChange = () => {
      fetchDrivers(currentPage);
    };

    socketService.on('driver:availability_changed', handleDriverStatusChange);

    return () => {
      socketService.off('driver:availability_changed', handleDriverStatusChange);
    };
  }, [filter]);

  const handlePageChange = (page) => {
    setCurrentPage(page);
    fetchDrivers(page);
  };

  // Pagination component
  const renderPagination = () => {
    if (totalPages <= 1) return null;

    return (
      <div className="d-flex justify-content-center mt-3">
        <Pagination>
          <Pagination.First 
            onClick={() => handlePageChange(1)} 
            disabled={currentPage === 1} 
          />
          <Pagination.Prev 
            onClick={() => handlePageChange(currentPage - 1)} 
            disabled={currentPage === 1} 
          />
          
          {[...Array(totalPages)].map((_, index) => {
            const pageNum = index + 1;
            if (
              pageNum === 1 || 
              pageNum === totalPages || 
              (pageNum >= currentPage - 2 && pageNum <= currentPage + 2)
            ) {
              return (
                <Pagination.Item
                  key={pageNum}
                  active={pageNum === currentPage}
                  onClick={() => handlePageChange(pageNum)}
                >
                  {pageNum}
                </Pagination.Item>
              );
            } else if (pageNum === currentPage - 3 || pageNum === currentPage + 3) {
              return <Pagination.Ellipsis key={pageNum} disabled />;
            }
            return null;
          })}
          
          <Pagination.Next 
            onClick={() => handlePageChange(currentPage + 1)} 
            disabled={currentPage === totalPages} 
          />
          <Pagination.Last 
            onClick={() => handlePageChange(totalPages)} 
            disabled={currentPage === totalPages} 
          />
        </Pagination>
      </div>
    );
  };

  const handleApprove = async (driverId, action) => {
    try {
      setProcessingId(driverId);
      await adminService.approveDriver(driverId, action === 'approve');
      
      await fetchDrivers();
      
      const messages = {
        approve: 'Ο οδηγός εγκρίθηκε!',
        reject: 'Ο οδηγός απορρίφθηκε!',
        pending: 'Ο οδηγός τέθηκε σε αναμονή!'
      };
      
      setAlertModal({
        show: true,
        variant: 'success',
        message: messages[action] || 'Η ενέργεια ολοκληρώθηκε!'
      });
    } catch (err) {
      setAlertModal({
        show: true,
        variant: 'danger',
        message: err.response?.data?.message || 'Σφάλμα κατά την επεξεργασία'
      });
    } finally {
      setProcessingId(null);
    }
  };

  const getStatusBadge = (status) => {
    const variants = {
      pending: 'warning',
      approved: 'success',
      rejected: 'danger'
    };
    
    const labels = {
      pending: 'Εκκρεμεί',
      approved: 'Εγκρίθηκε',
      rejected: 'Απορρίφθηκε'
    };

    return <Badge bg={variants[status]}>{labels[status]}</Badge>;
  };

  return (
    <div>
      <div className="mb-3">
        <h5 className="mb-3">Διαχείριση Οδηγών</h5>
        <div className="d-grid d-md-flex gap-2">
          <Button
            variant={filter === 'pending' ? 'primary' : 'outline-primary'}
            onClick={() => setFilter('pending')}
            size="sm"
          >
            Εκκρεμείς
          </Button>
          <Button
            variant={filter === 'approved' ? 'success' : 'outline-success'}
            onClick={() => setFilter('approved')}
            size="sm"
          >
            Εγκεκριμένοι
          </Button>
          <Button
            variant={filter === 'rejected' ? 'danger' : 'outline-danger'}
            onClick={() => setFilter('rejected')}
            size="sm"
          >
            Απορριφθέντες
          </Button>
          <Button
            variant={filter === 'all' ? 'secondary' : 'outline-secondary'}
            onClick={() => setFilter('all')}
            size="sm"
          >
            Όλοι
          </Button>
        </div>
        
        {/* Count info */}
        {!loading && (
          <div className="text-muted mt-2">
            Σύνολο: {totalCount} οδηγοί
            {totalPages > 1 && ` (Σελίδα ${currentPage} από ${totalPages})`}
          </div>
        )}
      </div>

      {loading ? (
        <div className="text-center py-5">
          <Spinner animation="border" variant="primary" />
          <p className="mt-3">Φόρτωση οδηγών...</p>
        </div>
      ) : error ? (
        <Alert variant="danger">{error}</Alert>
      ) : drivers.length === 0 ? (
        <Alert variant="info">Δεν βρέθηκαν οδηγοί</Alert>
      ) : isMobile ? (
        // Mobile Card View
        <Row className="g-3">
          {drivers.map((driver) => (
            <Col xs={12} key={driver._id}>
              <Card className="shadow-sm">
                <Card.Header className="d-flex justify-content-between align-items-center">
                  <strong>{driver.name}</strong>
                  {driver.isOnline ? (
                    <Badge bg="success">🟢 Online</Badge>
                  ) : (
                    <Badge bg="secondary">⚪ Offline</Badge>
                  )}
                </Card.Header>
                <Card.Body>
                  <div className="mb-2">
                    <small className="text-muted">📧 Email:</small><br />
                    {driver.email}
                  </div>
                  
                  <div className="mb-2">
                    <small className="text-muted">📞 Τηλέφωνο:</small><br />
                    <a href={`tel:${driver.phone}`} style={{ textDecoration: 'none', color: 'inherit' }}>
                      <strong>{driver.phone}</strong>
                    </a>
                  </div>
                  
                  <div className="mb-2">
                    <small className="text-muted">🚗 Όχημα:</small><br />
                    {driver.vehicle || driver.vehicleType || '-'} 
                    {(driver.licensePlate || driver.vehiclePlate) && 
                      ` - ${driver.licensePlate || driver.vehiclePlate}`
                    }
                  </div>
                  
                  <div className="mb-3">
                    <small className="text-muted">Κατάσταση:</small><br />
                    {getStatusBadge(driver.status)}
                  </div>
                  
                  <div className="d-grid gap-2">
                    {driver.status !== 'approved' && (
                      <Button
                        variant="success"
                        onClick={() => handleApprove(driver._id, 'approve')}
                        disabled={processingId === driver._id}
                      >
                        {processingId === driver._id ? (
                          <Spinner animation="border" size="sm" />
                        ) : (
                          '✅ Έγκριση Οδηγού'
                        )}
                      </Button>
                    )}
                    {driver.status !== 'rejected' && (
                      <Button
                        variant="danger"
                        onClick={() => handleApprove(driver._id, 'reject')}
                        disabled={processingId === driver._id}
                      >
                        ❌ Απόρριψη
                      </Button>
                    )}
                  </div>
                </Card.Body>
              </Card>
            </Col>
          ))}
        </Row>
      ) : (
        // Desktop Table View
        <div className="table-responsive">
          <Table striped bordered hover>
            <thead>
              <tr>
                <th>Όνομα</th>
                <th>Email</th>
                <th>Τηλέφωνο</th>
                <th>Όχημα</th>
                <th>Πινακίδα</th>
                <th>Διαθεσιμότητα</th>
                <th>Κατάσταση</th>
                <th>Ενέργειες</th>
              </tr>
            </thead>
            <tbody>
              {drivers.map((driver) => (
                <tr key={driver._id}>
                  <td className="fw-bold">{driver.name}</td>
                  <td>{driver.email}</td>
                  <td>
                    <a href={`tel:${driver.phone}`} style={{ textDecoration: 'none', color: 'inherit' }}>
                      {driver.phone}
                    </a>
                  </td>
                  <td>{driver.vehicle || driver.vehicleType || '-'}</td>
                  <td>{driver.licensePlate || driver.vehiclePlate || '-'}</td>
                  <td>
                    {driver.isOnline ? (
                      <Badge bg="success">Online</Badge>
                    ) : (
                      <Badge bg="secondary">Offline</Badge>
                    )}
                  </td>
                  <td>{getStatusBadge(driver.status)}</td>
                  <td>
                    <ButtonGroup size="sm">
                      {driver.status !== 'approved' && (
                        <Button
                          variant="success"
                          onClick={() => handleApprove(driver._id, 'approve')}
                          disabled={processingId === driver._id}
                          title="Έγκριση"
                        >
                          {processingId === driver._id ? (
                            <Spinner animation="border" size="sm" />
                          ) : (
                            '✅'
                          )}
                        </Button>
                      )}
                      {driver.status !== 'rejected' && (
                        <Button
                          variant="danger"
                          onClick={() => handleApprove(driver._id, 'reject')}
                          disabled={processingId === driver._id}
                          title="Απόρριψη"
                        >
                          ❌
                        </Button>
                      )}
                    </ButtonGroup>
                  </td>
                </tr>
              ))}
            </tbody>
          </Table>
        </div>
      )}
      
      {/* Pagination */}
      {!loading && renderPagination()}

      <AlertModal
        show={alertModal.show}
        onHide={() => setAlertModal({ ...alertModal, show: false })}
        variant={alertModal.variant}
        message={alertModal.message}
      />
    </div>
  );
};

export default DriversTab;
