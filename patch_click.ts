import fs from 'fs';

let content = fs.readFileSync('src/components/admin/CRMTable.tsx', 'utf8');

const targetStr = `      id: 'actions',
      header: 'Aksi',
      cell: ({ row }) => (
        <DropdownMenu>`;

const replacementStr = `      id: 'actions',
      header: 'Aksi',
      cell: ({ row }) => (
        <div onClick={(e) => e.stopPropagation()}>
          <DropdownMenu>`;

const targetStr2 = `          </DropdownMenuContent>
        </DropdownMenu>
      ),
    },
  ], []);`;

const replacementStr2 = `          </DropdownMenuContent>
        </DropdownMenu>
        </div>
      ),
    },
  ], []);`;

if (content.includes(targetStr) && content.includes(targetStr2)) {
  content = content.replace(targetStr, replacementStr);
  content = content.replace(targetStr2, replacementStr2);
  fs.writeFileSync('src/components/admin/CRMTable.tsx', content);
  console.log('Success');
} else {
  console.log('Target string not found');
}
