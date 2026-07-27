const fs = require('fs');

let content = fs.readFileSync('src/pages/Admin.tsx', 'utf-8');

// We need to add two new states for details modal
// 1. Jamaah Details
// 2. Transaksi Details
const stateReplacement = `
  const [activeTransaksiTab, setActiveTransaksiTab] = useState('pembayaran');
  const [isTransaksiModalOpen, setIsTransaksiModalOpen] = useState(false);
  const [editingTransaksi, setEditingTransaksi] = useState<any>(null);
  
  const [selectedJamaah, setSelectedJamaah] = useState<any>(null);
  const [isJamaahDetailsModalOpen, setIsJamaahDetailsModalOpen] = useState(false);
`;

content = content.replace(
  "  const [activeTransaksiTab, setActiveTransaksiTab] = useState('invoice');\n  const [isTransaksiModalOpen, setIsTransaksiModalOpen] = useState(false);\n  const [editingTransaksi, setEditingTransaksi] = useState<any>(null);",
  stateReplacement.trim()
);

fs.writeFileSync('src/pages/Admin.tsx', content);
