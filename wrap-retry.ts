import { Project, SyntaxKind, AwaitExpression, CallExpression, PropertyAccessExpression } from 'ts-morph';

const project = new Project();
project.addSourceFilesAtPaths('server.ts');

const sourceFile = project.getSourceFile('server.ts');

if (sourceFile) {
  let modifications = 0;
  
  // Find all AwaitExpressions
  const awaitExpressions = sourceFile.getDescendantsOfKind(SyntaxKind.AwaitExpression);
  
  for (let i = awaitExpressions.length - 1; i >= 0; i--) {
    const awaitExpr = awaitExpressions[i];
    const expr = awaitExpr.getExpression();
    
    let needsWrap = false;
    
    // Check if the expression being awaited is a db query
    // e.g. await db.select()... or await db.query.users.findMany() or await db.insert()... or await db.update()...
    
    // It's usually a CallExpression like db.select().from(...)
    if (expr.getKind() === SyntaxKind.CallExpression) {
      const callExpr = expr as CallExpression;
      const text = callExpr.getText();
      
      // If it starts with db. and is not already inside a withRetry
      if (text.startsWith('db.')) {
        // Check if its parent is an arrow function which is an argument to withRetry
        let parent = awaitExpr.getParent();
        let isWrapped = false;
        while (parent) {
          if (parent.getKind() === SyntaxKind.CallExpression) {
            const parentCall = parent as CallExpression;
            const exprText = parentCall.getExpression().getText();
            if (exprText === 'withRetry') {
              isWrapped = true;
              break;
            }
          }
          parent = parent.getParent();
        }
        
        if (!isWrapped) {
          needsWrap = true;
        }
      }
    }
    
    if (needsWrap) {
      const originalText = expr.getText();
      expr.replaceWithText(`withRetry(() => ${originalText})`);
      modifications++;
    }
  }
  
  if (modifications > 0) {
    sourceFile.saveSync();
    console.log(`Modified ${modifications} expressions.`);
  } else {
    console.log('No modifications needed.');
  }
} else {
  console.log('File not found.');
}
