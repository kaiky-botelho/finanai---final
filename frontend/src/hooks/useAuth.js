import { useState, useEffect } from 'react';

const USERS_STORAGE_KEY = 'finanai_users';
const CURRENT_USER_STORAGE_KEY = 'finanai_current_user';

export function useAuth() {
  const [users, setUsers] = useState(() => {
    const saved = localStorage.getItem(USERS_STORAGE_KEY);
    return saved ? JSON.parse(saved) : [];
  });

  const [currentUser, setCurrentUser] = useState(() => {
    const saved = localStorage.getItem(CURRENT_USER_STORAGE_KEY);
    return saved ? JSON.parse(saved) : null;
  });

  // Persiste a lista de usuários no LocalStorage
  useEffect(() => {
    localStorage.setItem(USERS_STORAGE_KEY, JSON.stringify(users));
  }, [users]);

  // Persiste a sessão do usuário atual no LocalStorage
  useEffect(() => {
    if (currentUser) {
      localStorage.setItem(CURRENT_USER_STORAGE_KEY, JSON.stringify(currentUser));
    } else {
      localStorage.removeItem(CURRENT_USER_STORAGE_KEY);
    }
  }, [currentUser]);

  // Ofusca a senha convertendo para Base64 (ofuscação local simples)
  const encodePassword = (password) => {
    try {
      return btoa(password);
    } catch (e) {
      return password;
    }
  };

  // Desofusca a senha
  const decodePassword = (encoded) => {
    try {
      return atob(encoded);
    } catch (e) {
      return encoded;
    }
  };

  /**
   * Registra um novo usuário
   * @param {Object} userData - { nome, email, senha, confirmSenha }
   */
  const registerUser = (userData) => {
    const { nome, email, senha, confirmSenha } = userData;

    if (!nome?.trim() || !email?.trim() || !senha?.trim()) {
      throw new Error('Todos os campos são obrigatórios.');
    }

    if (senha !== confirmSenha) {
      throw new Error('As senhas não coincidem.');
    }

    if (senha.length < 6) {
      throw new Error('A senha deve ter no mínimo 6 caracteres.');
    }

    const emailNormalizado = email.trim().toLowerCase();

    // Verifica se já existe o e-mail cadastrado
    const userExists = users.some(u => u.email === emailNormalizado);
    if (userExists) {
      throw new Error('Este e-mail já está cadastrado.');
    }

    const newUser = {
      id: `user-${Date.now()}`,
      nome: nome.trim(),
      email: emailNormalizado,
      senha: encodePassword(senha) // Ofusca a senha
    };

    setUsers(prev => [...prev, newUser]);
    
    // Login automático após cadastro
    setCurrentUser(newUser);
    return newUser;
  };

  /**
   * Faz o login de um usuário existente
   * @param {string} email - E-mail do usuário
   * @param {string} senha - Senha digitada
   */
  const loginUser = (email, senha) => {
    if (!email?.trim() || !senha?.trim()) {
      throw new Error('E-mail e senha são obrigatórios.');
    }

    const emailNormalizado = email.trim().toLowerCase();
    
    // Busca o usuário correspondente
    const foundUser = users.find(u => u.email === emailNormalizado);
    if (!foundUser) {
      throw new Error('E-mail ou senha incorretos.');
    }

    // Valida a senha decodificada
    const senhaSalva = decodePassword(foundUser.senha);
    if (senhaSalva !== senha) {
      throw new Error('E-mail ou senha incorretos.');
    }

    // Login bem-sucedido
    setCurrentUser(foundUser);
    return foundUser;
  };

  /**
   * Encerra a sessão do usuário atual
   */
  const logoutUser = () => {
    setCurrentUser(null);
  };

  return {
    currentUser,
    registerUser,
    loginUser,
    logoutUser,
    isLoggedIn: !!currentUser
  };
}
