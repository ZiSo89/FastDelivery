import React, { useState, useEffect, useCallback } from 'react';
import { Table, Badge, Spinner, Alert, Card, Row, Col, Pagination, Form, InputGroup, Button } from 'react-bootstrap';
import { adminService } from '../../services/api';

const CustomersTab = () => {
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);
  
  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const [searchTerm, setSearchTerm] = useState('');
  const [searchInput, setSearchInput] = useState('');
  const itemsPerPage = 20;

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const fetchCustomers = useCallback(async (page = currentPage) => {
    try {
      setLoading(true);
      const response = await adminService.getCustomers(page, itemsPerPage, searchTerm);
      setCustomers(response.customers || []);
      setTotalPages(response.totalPages || 1);
      setTotalCount(response.totalCount || 0);
      setCurrentPage(response.currentPage || page);
      setError('');
    } catch (err) {
      setError(err.response?.data?.message || 'Σφάλμα φόρτωσης πελατών');
    } finally {
      setLoading(false);
    }
  }, [currentPage, searchTerm]);

  useEffect(() => {
    fetchCustomers(1); // Reset to page 1 when search changes
  }, [searchTerm]);

  useEffect(() => {
    fetchCustomers();
  }, []);

  const handleSearch = (e) => {
    e.preventDefault();
    setSearchTerm(searchInput);
    setCurrentPage(1);
  };

  const handlePageChange = (page) => {
    setCurrentPage(page);
    fetchCustomers(page);
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

  return (
    <div>
      <div className="mb-3">
        <h5>Διαχείριση Πελατών</h5>
        
        {/* Search */}
        <Form onSubmit={handleSearch} className="mt-3">
          <InputGroup>
            <Form.Control
              type="text"
              placeholder="Αναζήτηση με όνομα, τηλέφωνο ή email..."
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
            />
            <Button variant="primary" type="submit">
              🔍 Αναζήτηση
            </Button>
            {searchTerm && (
              <Button 
                variant="outline-secondary" 
                onClick={() => { setSearchInput(''); setSearchTerm(''); }}
              >
                ✕
              </Button>
            )}
          </InputGroup>
        </Form>
        
        {/* Count info */}
        {!loading && (
          <div className="text-muted mt-2">
            Σύνολο: {totalCount} πελάτες
            {totalPages > 1 && ` (Σελίδα ${currentPage} από ${totalPages})`}
          </div>
        )}
      </div>

      {loading ? (
        <div className="text-center py-5">
          <Spinner animation="border" variant="primary" />
          <p className="mt-3">Φόρτωση πελατών...</p>
        </div>
      ) : error ? (
        <Alert variant="danger">{error}</Alert>
      ) : customers.length === 0 ? (
        <Alert variant="info">Δεν βρέθηκαν πελάτες</Alert>
      ) : isMobile ? (
        // Mobile Card View
        <>
          <Row className="g-3">
            {customers.map((customer) => (
              <Col xs={12} key={customer._id}>
                <Card className="shadow-sm">
                  <Card.Body>
                    <h6 className="fw-bold mb-2">{customer.name || 'N/A'}</h6>
                    
                    <div className="mb-2">
                      <small className="text-muted">📞 Τηλέφωνο:</small><br />
                      <a href={`tel:${customer.phone}`} style={{ textDecoration: 'none', color: 'inherit' }}>
                        <strong>{customer.phone}</strong>
                      </a>
                    </div>
                    
                    {customer.address && (
                      <div className="mb-2">
                        <small className="text-muted">📍 Διεύθυνση:</small><br />
                        {customer.address}
                      </div>
                    )}
                    
                    <div className="d-flex justify-content-between align-items-center mt-3">
                      <div>
                        <small className="text-muted">Παραγγελίες:</small><br />
                        <Badge bg="primary" className="fs-6">
                          {customer.totalOrders || customer.orderCount || 0}
                        </Badge>
                      </div>
                      <div>
                        {customer.isActive ? (
                          <Badge bg="success">Ενεργός</Badge>
                        ) : (
                          <Badge bg="danger">Ανενεργός</Badge>
                        )}
                      </div>
                    </div>
                    
                    <div className="mt-2">
                      <small className="text-muted">
                        Εγγραφή: {new Date(customer.createdAt).toLocaleDateString('el-GR')}
                      </small>
                    </div>
                  </Card.Body>
                </Card>
              </Col>
            ))}
          </Row>
          {renderPagination()}
        </>
      ) : (
        // Desktop Table View
        <div className="table-responsive">
          <Table striped bordered hover>
            <thead>
              <tr>
                <th>Όνομα</th>
                <th>Τηλέφωνο</th>
                <th>Διεύθυνση</th>
                <th>Σύνολο Παραγγελιών</th>
                <th>Κατάσταση</th>
                <th>Ημερομηνία Εγγραφής</th>
              </tr>
            </thead>
            <tbody>
              {customers.map((customer) => (
                <tr key={customer._id}>
                  <td className="fw-bold">{customer.name || 'N/A'}</td>
                  <td>
                    <a href={`tel:${customer.phone}`} style={{ textDecoration: 'none', color: 'inherit' }}>
                      {customer.phone}
                    </a>
                  </td>
                  <td>{customer.address || 'N/A'}</td>
                  <td className="text-center">
                    <Badge bg="primary">{customer.totalOrders || customer.orderCount || 0}</Badge>
                  </td>
                  <td>
                    {customer.isActive ? (
                      <Badge bg="success">Ενεργός</Badge>
                    ) : (
                      <Badge bg="danger">Ανενεργός</Badge>
                    )}
                  </td>
                  <td>
                    <small>{new Date(customer.createdAt).toLocaleDateString('el-GR')}</small>
                  </td>
                </tr>
              ))}
            </tbody>
          </Table>
        </div>
      )}
      
      {/* Pagination */}
      {renderPagination()}
    </div>
  );
};

export default CustomersTab;
