import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { login, register } from '../api/auth';
import useStore from '../store';

export function useAuth() {
  const [loading, setLoading] = useState(false);
  const setAuth = useStore(s => s.setAuth);
  const logout  = useStore(s => s.logout);
  const navigate = useNavigate();

  async function handleLogin(email, password) {
    setLoading(true);
    try {
      const { data } = await login({ email, password });
      setAuth(data.token, data.user);
      navigate('/');
      toast.success(`Welcome back, ${data.user.name}!`);
    } catch (err) {
      toast.error(err.response?.data?.error || 'Login failed');
    } finally {
      setLoading(false);
    }
  }

  async function handleRegister(name, email, password) {
    setLoading(true);
    try {
      const { data } = await register({ name, email, password });
      setAuth(data.token, data.user);
      navigate('/');
      toast.success('Account created!');
    } catch (err) {
      toast.error(err.response?.data?.error || 'Registration failed');
    } finally {
      setLoading(false);
    }
  }

  function handleLogout() {
    logout();
    navigate('/login');
    toast.success('Logged out');
  }

  return { handleLogin, handleRegister, handleLogout, loading };
}
