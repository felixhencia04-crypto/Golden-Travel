import { readFileSync, writeFileSync } from 'fs';

let content = readFileSync('src/pages/LoginAdmin.tsx', 'utf8');

// Replace handleLogin
const oldHandleLogin = `
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      const idToken = await userCredential.user.getIdToken();
      
      // Sync with backend
      // Admin role is special, backend sync will return it if user exists in DB with role='admin'
      const user = await api.post('/auth/sync', {});
      
      if (user.role === 'admin') {
        toast.success("Selamat datang, Admin!");
        navigate('/admin');
      } else {
        await auth.signOut();
        toast.error("Akses ditolak: Anda bukan Administrator.");
      }
    } catch (err: any) {
      toast.error(err.message || "Gagal masuk. Periksa email dan kata sandi Anda.");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };
`;

const newHandleLogin = `
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      // Use custom API endpoint for admin login (no email required)
      const res = await api.post('/admin/login', { password });
      
      if (res.token) {
        // We need to store this token somehow so the app can use it for requests.
        // The app's api.ts currently uses Firebase Auth to get the token.
        // Let's store it in localStorage.
        localStorage.setItem('admin_token', res.token);
        
        toast.success("Selamat datang, Admin!");
        navigate('/admin');
      } else {
        toast.error("Kata sandi salah.");
      }
    } catch (err: any) {
      toast.error(err.response?.data?.error || "Gagal masuk.");
    } finally {
      setLoading(false);
    }
  };
`;

content = content.replace(oldHandleLogin.trim(), newHandleLogin.trim());

// Remove loginWithGoogle
content = content.replace(/const loginWithGoogle = async \(\) => \{[\s\S]*?\};\n/g, '');

// Update form (remove email input and google button)
content = content.replace(/<div className="input-group">\s*<label>Alamat Email<\/label>[\s\S]*?<\/div>\s*<div className="input-group">/, '<div className="input-group">');
content = content.replace(/<div className="mt-4 pt-4 border-t border-white\/10 text-center">[\s\S]*?<\/div>/, '');

writeFileSync('src/pages/LoginAdmin.tsx', content);
