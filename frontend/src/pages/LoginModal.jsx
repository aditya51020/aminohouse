// src/pages/LoginModal.jsx
import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';

const LoginModal = ({ onClose, onSuccess }) => {
  const [step, setStep] = useState(1);
  const [phone, setPhone] = useState('');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const { login, completeProfile } = useAuth();

  const handlePhone = async () => {
    if (phone.length !== 10) return alert('Enter 10-digit phone');
    const user = await login(phone);
    if (user.hasProfile) {
      onSuccess();
      onClose();
    } else {
      setStep(2);
    }
  };

  const handleProfile = async () => {
    if (!name) return alert('Name required');
    await completeProfile(name, email);
    onSuccess();
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-60 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl p-6 w-full max-w-sm shadow-2xl">
        <h2 className="text-xl font-bold text-center mb-5">
          {step === 1 ? 'Login with Phone' : 'Complete Profile'}
        </h2>

        {step === 1 ? (
          <>
            <input
              type="tel"
              value={phone}
              onChange={e => setPhone(e.target.value.replace(/\D/g, '').slice(0, 10))}
              placeholder="10-digit mobile"
              className="w-full p-4 border-2 border-gray-300 rounded-xl text-lg text-center font-mono"
            />
            <button
              onClick={handlePhone}
              className="w-full mt-4 bg-green-600 text-white py-3.5 rounded-xl font-bold hover:bg-green-700"
            >
              Continue
            </button>
          </>
        ) : (
          <>
            <input
              type="text"
              value={name}
              onChange={e => setName(e.target.value)}
              placeholder="Full Name *"
              className="w-full p-4 border-2 border-gray-300 rounded-xl mb-3"
            />
            <input
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              placeholder="Email (optional)"
              className="w-full p-4 border-2 border-gray-300 rounded-xl mb-4"
            />
            <button
              onClick={handleProfile}
              className="w-full bg-green-600 text-white py-3.5 rounded-xl font-bold hover:bg-green-700"
            >
              Save & Order
            </button>
          </>
        )}

        <button
          onClick={onClose}
          className="w-full mt-3 text-gray-600 text-sm hover:text-gray-900"
        >
          Skip for now
        </button>
      </div>
    </div>
  );
};

export default LoginModal;