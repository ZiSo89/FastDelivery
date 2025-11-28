import React, { useState, useEffect, useRef } from 'react';
import { View, Text, TextInput, TouchableOpacity, Modal, StyleSheet, KeyboardAvoidingView, Platform, ScrollView, Keyboard } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

const GuestDetailsModal = ({ visible, onClose, onSubmit, initialData = {} }) => {
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [address, setAddress] = useState('');
  const [errors, setErrors] = useState({});
  const scrollViewRef = useRef(null);
  const phoneInputRef = useRef(null);
  const addressInputRef = useRef(null);

  useEffect(() => {
    if (visible) {
      setName(initialData?.name || '');
      setPhone(initialData?.phone || '');
      setAddress(initialData?.address || '');
      setErrors({});
    }
  }, [visible, initialData]);

  const handlePhoneChange = (text) => {
    // Only allow numbers
    const cleaned = text.replace(/[^0-9]/g, '');
    if (cleaned.length <= 10) {
      setPhone(cleaned);
    }
  };

  const validate = () => {
    const newErrors = {};
    
    if (!name.trim()) {
      newErrors.name = 'Το όνομα είναι υποχρεωτικό';
    }
    
    if (!phone.trim()) {
      newErrors.phone = 'Το τηλέφωνο είναι υποχρεωτικό';
    } else if (phone.length !== 10) {
      newErrors.phone = 'Το τηλέφωνο πρέπει να έχει 10 ψηφία';
    }
    
    if (!address.trim()) {
      newErrors.address = 'Η διεύθυνση είναι υποχρεωτική';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = () => {
    if (validate()) {
      onSubmit({ name: name.trim(), phone: phone.trim(), address: address.trim() });
    }
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
    >
      <KeyboardAvoidingView 
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.overlay}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 20}
      >
        <TouchableOpacity style={styles.overlayBackground} activeOpacity={1} onPress={Keyboard.dismiss} />
        <View style={styles.container}>
          <ScrollView 
            ref={scrollViewRef}
            contentContainerStyle={styles.scrollContent}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
          >
            {/* Header */}
            <View style={styles.header}>
              <View style={styles.headerIcon}>
                <Ionicons name="person-add" size={28} color="#00c1e8" />
              </View>
              <Text style={styles.title}>Στοιχεία Παράδοσης</Text>
              <Text style={styles.subtitle}>Συμπληρώστε τα στοιχεία σας για την παραγγελία</Text>
            </View>

            {/* Form */}
            <View style={styles.form}>
              {/* Name Input */}
              <View style={[styles.inputContainer, errors.name && styles.inputContainerError]}>
                <View style={styles.inputIcon}>
                  <Ionicons name="person-outline" size={20} color={errors.name ? "#e74c3c" : "#666"} />
                </View>
                <TextInput
                  style={styles.input}
                  placeholder="Ονοματεπώνυμο"
                  placeholderTextColor="#999"
                  value={name}
                  onChangeText={(text) => { setName(text); if(errors.name) setErrors({...errors, name: null}); }}
                  autoCapitalize="words"
                  returnKeyType="next"
                  onSubmitEditing={() => phoneInputRef.current?.focus()}
                  blurOnSubmit={false}
                />
              </View>
              {errors.name && <Text style={styles.errorText}>{errors.name}</Text>}

              {/* Phone Input */}
              <View style={[styles.inputContainer, errors.phone && styles.inputContainerError]}>
                <View style={styles.inputIcon}>
                  <Ionicons name="call-outline" size={20} color={errors.phone ? "#e74c3c" : "#666"} />
                </View>
                <TextInput
                  ref={phoneInputRef}
                  style={styles.input}
                  placeholder="Τηλέφωνο (10 ψηφία)"
                  placeholderTextColor="#999"
                  value={phone}
                  onChangeText={(text) => { handlePhoneChange(text); if(errors.phone) setErrors({...errors, phone: null}); }}
                  keyboardType="phone-pad"
                  maxLength={10}
                  returnKeyType="next"
                  onSubmitEditing={() => addressInputRef.current?.focus()}
                  blurOnSubmit={false}
                />
              </View>
              {errors.phone && <Text style={styles.errorText}>{errors.phone}</Text>}

              {/* Address Input */}
              <View style={[styles.inputContainer, errors.address && styles.inputContainerError]}>
                <View style={styles.inputIcon}>
                  <Ionicons name="location-outline" size={20} color={errors.address ? "#e74c3c" : "#666"} />
                </View>
                <TextInput
                  ref={addressInputRef}
                  style={styles.input}
                  placeholder="Διεύθυνση παράδοσης"
                  placeholderTextColor="#999"
                  value={address}
                  onChangeText={(text) => { setAddress(text); if(errors.address) setErrors({...errors, address: null}); }}
                  returnKeyType="done"
                  onFocus={() => {
                    setTimeout(() => {
                      scrollViewRef.current?.scrollToEnd({ animated: true });
                    }, 300);
                  }}
                />
              </View>
              {errors.address && <Text style={styles.errorText}>{errors.address}</Text>}
            </View>

            {/* Buttons */}
            <View style={styles.buttonContainer}>
              <TouchableOpacity style={styles.cancelButton} onPress={onClose}>
                <Text style={styles.cancelButtonText}>Ακύρωση</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.submitButton} onPress={handleSubmit}>
                <Text style={styles.submitButtonText}>Συνέχεια</Text>
                <Ionicons name="arrow-forward" size={18} color="#fff" style={{ marginLeft: 6 }} />
              </TouchableOpacity>
            </View>
          </ScrollView>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  overlayBackground: {
    flex: 1,
  },
  container: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: '80%',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -5 },
    shadowOpacity: 0.2,
    shadowRadius: 20,
    elevation: 20,
  },
  scrollContent: {
    padding: 24,
    paddingBottom: 40,
  },
  header: {
    alignItems: 'center',
    marginBottom: 24,
  },
  headerIcon: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#e6f9fc',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  title: {
    fontSize: 22,
    fontWeight: '700',
    color: '#2c3e50',
    marginBottom: 6,
  },
  subtitle: {
    fontSize: 14,
    color: '#888',
    textAlign: 'center',
  },
  form: {
    marginBottom: 24,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f8f9fa',
    borderRadius: 12,
    marginBottom: 4,
    borderWidth: 1.5,
    borderColor: '#e0e0e0',
  },
  inputContainerError: {
    borderColor: '#e74c3c',
    backgroundColor: '#fff5f5',
  },
  inputIcon: {
    paddingLeft: 16,
    paddingRight: 12,
  },
  input: {
    flex: 1,
    paddingVertical: 16,
    paddingRight: 16,
    fontSize: 16,
    color: '#333',
  },
  errorText: {
    color: '#e74c3c',
    fontSize: 12,
    marginBottom: 12,
    marginLeft: 16,
  },
  buttonContainer: {
    flexDirection: 'row',
    gap: 12,
  },
  cancelButton: {
    flex: 1,
    paddingVertical: 16,
    borderRadius: 12,
    backgroundColor: '#f0f2f5',
    alignItems: 'center',
  },
  cancelButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#666',
  },
  submitButton: {
    flex: 1.5,
    flexDirection: 'row',
    paddingVertical: 16,
    borderRadius: 12,
    backgroundColor: '#00c1e8',
    alignItems: 'center',
    justifyContent: 'center',
  },
  submitButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
  },
});

export default GuestDetailsModal;
