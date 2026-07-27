import { readFileSync, writeFileSync } from 'fs';

let content = readFileSync('src/pages/Admin.tsx', 'utf8');

const hookCall = 'const { users, registrations, loading, currentUser, refreshData } = useAdminData();\n  const navigate = useNavigate();';

const hookCallWithEffect = `const { users, registrations, loading, currentUser, refreshData } = useAdminData();
  const navigate = useNavigate();

  React.useEffect(() => {
    if (!localStorage.getItem('admin_token')) {
      navigate('/admin/login');
    }
  }, [navigate]);`;

content = content.replace(hookCall, hookCallWithEffect);

writeFileSync('src/pages/Admin.tsx', content);
