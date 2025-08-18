import React, { createContext, useContext, useState, useEffect } from 'react';

const AuthContext = createContext();

export const useAuthContext = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuthContext debe ser usado dentro de AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  // Verificar sesión al cargar la app
  useEffect(() => {
    checkSession();
  }, []);

  const checkSession = async () => {
    try {
      setLoading(true);
      console.log('🔍 FRONTEND - Iniciando checkSession...');
      
      const response = await fetch('http://localhost:4000/api/verify-session', {
        method: 'GET',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      console.log('📡 FRONTEND - Respuesta status:', response.status);

      if (response.ok) {
        const data = await response.json();
        
        console.log('🔍 FRONTEND - Respuesta completa del verify-session:', data);
        console.log('🔍 FRONTEND - Tipo de data:', typeof data);
        console.log('🔍 FRONTEND - Keys de data:', Object.keys(data));
        
        // ✅ SOLUCIÓN: Manejar múltiples formatos de respuesta del backend
        let userData = null;
        
        // Caso 1: Backend devuelve { user: { id, email, ... } }
        if (data.user && data.user.id) {
          console.log('✅ FRONTEND - Formato: { user: {...} }');
          userData = data.user;
        } 
        // Caso 2: Backend devuelve { id, email, role, ... } directamente  
        else if (data.id) {
          console.log('✅ FRONTEND - Formato: { id, email, ... } directo');
          userData = data;
        }
        // Caso 3: Backend devuelve { data: { id, email, ... } }
        else if (data.data && data.data.id) {
          console.log('✅ FRONTEND - Formato: { data: {...} }');
          userData = data.data;
        }
        
        console.log('👤 FRONTEND - userData extraída:', userData);
        
        // ✅ Verificación final más robusta
        if (userData && userData.id && userData.email) {
          setUser(userData);
          setIsAuthenticated(true);
          console.log('✅ FRONTEND - Sesión establecida correctamente:', userData);
        } else {
          console.warn('⚠️ FRONTEND - Datos de usuario incompletos');
          console.warn('📋 FRONTEND - userData:', userData);
          console.warn('📋 FRONTEND - Esperado: { id, email, role }');
          setUser(null);
          setIsAuthenticated(false);
        }
      } else {
        // ✅ Manejar diferentes códigos de error
        if (response.status === 401) {
          console.log('❌ No hay sesión activa (401)');
        } else {
          console.log('❌ Error verificando sesión:', response.status);
        }
        setUser(null);
        setIsAuthenticated(false);
      }
    } catch (error) {
      console.error('Error verificando sesión:', error);
      setUser(null);
      setIsAuthenticated(false);
    } finally {
      setLoading(false);
    }
  };

  const login = async (email, password) => {
    try {
      const response = await fetch('http://localhost:4000/api/login', {
        method: 'POST',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password }),
      });

      const data = await response.json();

      if (response.ok) {
        // ✅ CORREGIDO: Verificar que los datos del usuario sean válidos
        if (data.user && data.user.id) {
          setUser(data.user);
          setIsAuthenticated(true);
          console.log('✅ Login exitoso:', data.user);
          return { success: true, data };
        } else {
          console.warn('⚠️ Login sin datos de usuario válidos:', data);
          throw new Error('Datos de usuario incompletos');
        }
      } else {
        throw new Error(data.message || 'Error al iniciar sesión');
      }
    } catch (error) {
      console.error('❌ Error en login:', error);
      return { success: false, error: error.message };
    }
  };

  const logout = async () => {
    try {
      await fetch('http://localhost:4000/api/logout', {
        method: 'POST',
        credentials: 'include',
      });
      console.log('✅ Logout exitoso');
    } catch (error) {
      console.error('Error al cerrar sesión:', error);
    } finally {
      setUser(null);
      setIsAuthenticated(false);
    }
  };

  // ✅ NUEVA FUNCIÓN: Para debug y verificación
  const getUserData = () => {
    console.log('📊 DATOS ACTUALES DEL CONTEXTO:');
    console.log('User:', user);
    console.log('Loading:', loading);
    console.log('IsAuthenticated:', isAuthenticated);
    return { user, loading, isAuthenticated };
  };

  const value = {
    user,
    loading,
    isAuthenticated,
    login,
    logout,
    checkSession,
    getUserData, // ✅ Para debugging
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};