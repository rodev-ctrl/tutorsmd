import React, { useState, useMemo, FunctionComponent } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { TextField, Button, Box, Typography, Container, Alert } from '@mui/material';
import { useLanguage } from '../../../context/LanguageContext';
import AuthService from '../../../services/AuthServices'; 

const PasswordForgot: FunctionComponent = () => {
  const { link } = useParams<{ link: string }>();
  const { language } = useLanguage();
  const navigate = useNavigate();

  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);

  const t = useMemo(() => {
    return {
      title: language === "russian" ? "Новый пароль" : language === "german" ? "Neues Passwort" : "New Password",
      placeholder: language === "russian" ? "Введите новый пароль" : language === "german" ? "Neues Passwort eingeben" : "Enter new password",
      confirm: language === "russian" ? "Подтвердите пароль" : language === "german" ? "Passwort bestätigen" : "Confirm password",
      button: language === "russian" ? "Изменить пароль" : language === "german" ? "Passwort ändern" : "Change Password",
      mismatch: language === "russian" ? "Пароли не совпадают" : language === "german" ? "Passwörter stimmen nicht überein" : "Passwords do not match",
      successMsg: language === "russian" ? "Пароль успешно изменен!" : language === "german" ? "Passwort erfolgreich geändert!" : "Password changed successfully!",
      loginBtn: language === "russian" ? "Перейти к логину" : language === "german" ? "Zum Login" : "Go to login",
    };
  }, [language]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (password !== confirmPassword) {
      setError(t.mismatch);
      return;
    }

    setLoading(true);
    try {
      await AuthService.passwordReset(link!, password);
      setSuccess(true);
      
      // Через 3 секунды редирект, если не нажал кнопку
      setTimeout(() => navigate('/'), 3000);
    } catch (e: any) {
      const msg = e.response?.data?.message || "Error";
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <Container maxWidth="xs">
        <Box sx={{ mt: 8, textAlign: 'center' }}>
          <Alert severity="success">{t.successMsg}</Alert>
          <Button sx={{ mt: 2 }} onClick={() => navigate('/login')}>
            {t.loginBtn}
          </Button>
        </Box>
      </Container>
    );
  }

  return (
    <Container maxWidth="xs">
      <Box sx={{ mt: 8, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
        <Typography component="h1" variant="h5">{t.title}</Typography>
        <Box component="form" onSubmit={handleSubmit} sx={{ mt: 1, width: '100%' }}>
          <TextField
            margin="normal"
            required
            fullWidth
            type="password"
            label={t.placeholder}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
          <TextField
            margin="normal"
            required
            fullWidth
            type="password"
            label={t.confirm}
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
          />
          {error && <Alert severity="error" sx={{ mt: 2 }}>{error}</Alert>}
          <Button
            type="submit"
            fullWidth
            variant="contained"
            disabled={loading || !password}
            sx={{ mt: 3, mb: 2, bgcolor: '#4A90E2' }}
          >
            {loading ? '...' : t.button}
          </Button>
        </Box>
      </Box>
    </Container>
  );
};

export default PasswordForgot;