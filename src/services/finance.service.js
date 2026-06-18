const { prisma } = require('../config/prisma');

async function writeAuditSafe({ action, entity, entityId, userId, companyId, metadata = {} }) {
  try {
    await prisma.auditLog.create({
      data: { action, entity, entityId, userId, companyId, metadata }
    });
  } catch (error) {
    console.warn('[StockFlow Audit Warning]', error.message);
  }
}

async function listExpenses(companyId) {
  return prisma.expense.findMany({
    where: { companyId },
    include: {
      user: { select: { id: true, name: true, role: true } }
    },
    orderBy: { createdAt: 'desc' }
  });
}

async function createExpense(companyId, userId, data) {
  const expense = await prisma.expense.create({
    data: {
      description: data.description,
      category: data.category,
      amount: data.amount,
      status: data.status || 'PENDING',
      dueDate: data.dueDate ? new Date(data.dueDate) : null,
      paidAt: data.status === 'PAID' ? new Date() : null,
      companyId,
      userId
    }
  });

  await writeAuditSafe({
    action: 'EXPENSE_CREATED',
    entity: 'Expense',
    entityId: expense.id,
    userId,
    companyId,
    metadata: {
      description: expense.description,
      amount: Number(expense.amount),
      category: expense.category,
      status: expense.status
    }
  });

  return expense;
}

async function cancelExpense(companyId, userId, id, reason = 'Cancelamento operacional') {
  const expense = await prisma.expense.findFirst({ where: { id, companyId } });

  if (!expense) {
    const error = new Error('Despesa não encontrada');
    error.statusCode = 404;
    throw error;
  }

  if (expense.status === 'CANCELED') {
    const error = new Error('Despesa já está cancelada');
    error.statusCode = 400;
    throw error;
  }

  const updated = await prisma.expense.update({
    where: { id },
    data: { status: 'CANCELED' }
  });

  await writeAuditSafe({
    action: 'EXPENSE_CANCELED',
    entity: 'Expense',
    entityId: id,
    userId,
    companyId,
    metadata: {
      description: expense.description,
      amount: Number(expense.amount),
      previousStatus: expense.status,
      newStatus: 'CANCELED',
      reason,
      canceledAt: new Date().toISOString()
    }
  });

  return updated;
}

async function reactivateExpense(companyId, userId, id, reason = 'Reativação operacional') {
  const expense = await prisma.expense.findFirst({ where: { id, companyId } });

  if (!expense) {
    const error = new Error('Despesa não encontrada');
    error.statusCode = 404;
    throw error;
  }

  if (expense.status !== 'CANCELED') {
    const error = new Error('Apenas despesas canceladas podem ser reativadas');
    error.statusCode = 400;
    throw error;
  }

  const updated = await prisma.expense.update({
    where: { id },
    data: { status: 'PENDING' }
  });

  await writeAuditSafe({
    action: 'EXPENSE_REACTIVATED',
    entity: 'Expense',
    entityId: id,
    userId,
    companyId,
    metadata: {
      description: expense.description,
      amount: Number(expense.amount),
      previousStatus: expense.status,
      newStatus: 'PENDING',
      reason,
      reactivatedAt: new Date().toISOString()
    }
  });

  return updated;
}

async function deleteExpense(companyId, id, userId = null) {
  return cancelExpense(companyId, userId, id, 'Cancelamento via rota compatível DELETE');
}

module.exports = {
  listExpenses,
  createExpense,
  cancelExpense,
  reactivateExpense,
  deleteExpense
};
