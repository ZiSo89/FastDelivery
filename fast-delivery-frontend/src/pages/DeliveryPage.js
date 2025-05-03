import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { io } from 'socket.io-client'; // Εισαγωγή του Socket.IO client

function DeliveryPage() {
    const [deliveryUsers, setDeliveryUsers] = useState([]); // Λίστα με τους delivery χρήστες
    const [selectedUserId, setSelectedUserId] = useState(''); // Επιλεγμένος χρήστης
    const [orders, setOrders] = useState([]); // Παραγγελίες του επιλεγμένου χρήστη
    const [error, setError] = useState('');
    const [statusFilters, setStatusFilters] = useState({
        'Σε Εξέλιξη': true,
        'Ολοκληρώθηκε': true,
        'Ακυρώθηκε': true,
    }); // Φίλτρα για τις καταστάσεις
    const socket = io('http://192.168.1.8:5000'); // Σύνδεση με τον Socket.IO server

    useEffect(() => {
        // Άκου για ενημερώσεις κατάστασης παραγγελιών μέσω Socket.IO
        socket.on('orderStatusUpdated', (updatedOrder) => {
            console.log('Η κατάσταση της παραγγελίας ενημερώθηκε:', updatedOrder);

            // Ενημέρωση του state για τη συγκεκριμένη παραγγελία
            setOrders((prevOrders) =>
                prevOrders.map((order) =>
                    order._id === updatedOrder._id ? { ...order, status: updatedOrder.status } : order
                )
            );
        });

        // Καθαρισμός σύνδεσης όταν αποσυνδέεται το component
        return () => {
            socket.off('orderStatusUpdated');
        };
    }, []);

    useEffect(() => {
        // Φόρτωσε τη λίστα των delivery χρηστών
        const fetchDeliveryUsers = async () => {
            try {
                const response = await axios.get('http://192.168.1.8:5000/api/users/delivery');
                setDeliveryUsers(response.data);
            } catch (err) {
                console.error('Σφάλμα κατά τη φόρτωση των διανομέων:', err);
                setError('Αποτυχία φόρτωσης των διανομέων. Παρακαλώ δοκιμάστε ξανά.');
            }
        };

        fetchDeliveryUsers();
    }, []);

    useEffect(() => {
        const fetchAssignedOrders = async () => {
            if (!selectedUserId) return; // Αν δεν έχει επιλεγεί χρήστης, μην κάνεις request
            try {
                console.log('Ανάκτηση παραγγελιών για userId:', selectedUserId); // Debug log
                const response = await axios.get(`http://192.168.1.8:5000/api/orders/assigned/${selectedUserId}`);
                console.log('Παραγγελίες που ανακτήθηκαν:', response.data); // Debug log
                setOrders(response.data);
            } catch (err) {
                console.error('Σφάλμα κατά την ανάκτηση των παραγγελιών:', err);
                setError('Αποτυχία ανάκτησης των παραγγελιών. Παρακαλώ δοκιμάστε ξανά.');
            }
        };

        fetchAssignedOrders();
    }, [selectedUserId]);

    
    useEffect(() => {
        // Άκου για ενημερώσεις παραγγελιών μέσω Socket.IO
        socket.on('orderUpdated', async (updatedOrder) => {
            console.log('Ενημερωμένη παραγγελία:', updatedOrder);
    
            // Ανάκτηση των παραγγελιών του επιλεγμένου χρήστη
            if (selectedUserId) {
                try {
                    const response = await axios.get(`http://192.168.1.8:5000/api/orders/assigned/${selectedUserId}`);
                    console.log('Ανανεωμένες παραγγελίες:', response.data);
                    setOrders(response.data); // Ενημέρωση του state με τις νέες παραγγελίες
                } catch (err) {
                    console.error('Σφάλμα κατά την ανάκτηση των παραγγελιών:', err);
                    setError('Αποτυχία ανάκτησης των παραγγελιών. Παρακαλώ δοκιμάστε ξανά.');
                }
            }
        });
    
        // Καθαρισμός σύνδεσης όταν αποσυνδέεται το component
        return () => {
            socket.off('orderUpdated');
        };
    }, [selectedUserId]);
    


    const handleStatusChange = async (orderId, status) => {
        try {
            const response = await axios.put(`http://192.168.1.8:5000/api/orders/${orderId}/status`, { status });
            console.log('Η κατάσταση της παραγγελίας ενημερώθηκε:', response.data);
            socket.emit('updateOrderStatus', response.data); // Στέλνει ενημέρωση στους clients
            // Ενημέρωση του state για τη συγκεκριμένη παραγγελία
            setOrders((prevOrders) =>
                prevOrders.map((order) =>
                    order._id === orderId ? { ...order, status } : order
                )
            );
        } catch (err) {
            console.error('Σφάλμα κατά την ενημέρωση της κατάστασης:', err);
            setError('Αποτυχία ενημέρωσης της κατάστασης. Παρακαλώ δοκιμάστε ξανά.');
        }
    };

    const handleStatusFilterChange = (status) => {
        setStatusFilters((prevFilters) => ({
            ...prevFilters,
            [status]: !prevFilters[status],
        }));
    };

    const filteredOrders = orders.filter((order) => statusFilters[order.status]);

    return (
        <div className="container mt-4">
            <h1 className="text-center mb-4">Διαχείριση Διανομέων</h1>
            {error && <p className="text-danger">{error}</p>}

            <div className="mb-4">
                <label className="form-label">Επιλέξτε Διανομέα:</label>
                <select
                    className="form-select"
                    value={selectedUserId}
                    onChange={(e) => setSelectedUserId(e.target.value)}
                >
                    <option value="">-- Επιλέξτε Διανομέα --</option>
                    {deliveryUsers.map((user) => (
                        <option key={user._id} value={user._id}>
                            {user.name}
                        </option>
                    ))}
                </select>
            </div>

            <div className="mb-4">
                <h5>Φίλτρα Κατάστασης:</h5>
                {Object.keys(statusFilters).map((status) => (
                    <div className="form-check" key={status}>
                        <input
                            className="form-check-input"
                            type="checkbox"
                            id={`filter-${status}`}
                            checked={statusFilters[status]}
                            onChange={() => handleStatusFilterChange(status)}
                        />
                        <label className="form-check-label" htmlFor={`filter-${status}`}>
                            {status}
                        </label>
                    </div>
                ))}
            </div>

            <h2 className="mb-3">Ανατεθειμένες Παραγγελίες</h2>
            <div className="row">
                {filteredOrders.length > 0 ? (
                    filteredOrders.map((order, index) => (
                        <div className="col-md-6 mb-4" key={`${order._id}-${index}`}>
                            <div className="card">
                                <div className="card-body">
                                    <h5 className="card-title">Κατάστημα: {order.storeId?.name || 'N/A'}</h5>
                                    <p className="card-text">
                                        <strong>Διεύθυνση Παραλαβής:</strong> {order.storeId?.address || 'N/A'}
                                    </p>
                                    <p className="card-text">
                                        <strong>Διεύθυνση Παράδοσης:</strong> {order.address}
                                    </p>
                                    <p className="card-text">
                                        <strong>Προϊόντα:</strong> {order.items}
                                    </p>
                                    <p className="card-text">
                                        <strong>Κατάσταση:</strong> {order.status}
                                    </p>
                                    <div className="mb-3">
                                        <label className="form-label">Αλλαγή Κατάστασης:</label>
                                        <select
                                            className="form-select"
                                            value={order.status}
                                            onChange={(e) => handleStatusChange(order._id, e.target.value)}
                                        >
                                            <option value="Σε Εξέλιξη">Σε Εξέλιξη</option>
                                            <option value="Ολοκληρώθηκε">Ολοκληρώθηκε</option>
                                            <option value="Ακυρώθηκε">Ακυρώθηκε</option>
                                        </select>
                                    </div>
                                </div>
                            </div>
                        </div>
                    ))
                ) : (
                    <p className="text-center">Δεν υπάρχουν παραγγελίες για τις επιλεγμένες καταστάσεις.</p>
                )}
            </div>
        </div>
    );
}

export default DeliveryPage;