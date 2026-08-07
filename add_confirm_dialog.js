import fs from 'fs';
let code = fs.readFileSync('src/components/admin/CMSManager.tsx', 'utf8');

const confirmDialogStr = `
// --- CONFIRM DIALOG COMPONENT ---
function ConfirmDialog({ isOpen, title, message, onConfirm, onCancel, confirmText = "Hapus", cancelText = "Batal", isDanger = true }: {
  isOpen: boolean;
  title: string;
  message: string;
  onConfirm: () => void;
  onCancel: () => void;
  confirmText?: string;
  cancelText?: string;
  isDanger?: boolean;
}) {
  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-gray-900/40 backdrop-blur-sm transition-opacity">
      <div className="bg-white rounded-2xl p-6 w-full max-w-sm shadow-xl transform transition-all border border-gray-100">
        <div className="flex items-center justify-center w-12 h-12 rounded-full bg-red-50 text-red-500 mb-4">
          <AlertCircle className="w-6 h-6" />
        </div>
        <h3 className="text-lg font-bold text-gray-900 mb-2">{title}</h3>
        <p className="text-sm text-gray-500 mb-6">{message}</p>
        <div className="flex justify-end space-x-3">
          <button
            onClick={onCancel}
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-xl hover:bg-gray-50 transition-colors"
          >
            {cancelText}
          </button>
          <button
            onClick={onConfirm}
            className={\`px-4 py-2 text-sm font-medium text-white rounded-xl transition-colors \${isDanger ? 'bg-red-600 hover:bg-red-700 shadow-sm shadow-red-600/20' : 'bg-gold-500 hover:bg-gold-600 text-gray-900'}\`}
          >
            {confirmText}
          </button>
        </div>
      </div>
    </div>
  );
}
`;

if (!code.includes("ConfirmDialog")) {
  const insertIndex = code.indexOf('// --- SUB-COMPONENTS ---');
  code = code.slice(0, insertIndex) + confirmDialogStr + '\n' + code.slice(insertIndex);
  fs.writeFileSync('src/components/admin/CMSManager.tsx', code);
  console.log("Success adding ConfirmDialog");
} else {
  console.log("ConfirmDialog already exists");
}
