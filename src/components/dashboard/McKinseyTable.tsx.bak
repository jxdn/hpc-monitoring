.McKinseyTable {
  width: 100%;
  background: white;
  border-radius: var(--radius-lg);
  border: 1px solid var(--color-neutral-300);
  box-shadow: var(--shadow-md);
  overflow: hidden;
  transition: all 0.3s ease;
}

.McKinseyTable:hover {
  box-shadow: var(--shadow-lg);
  border-color: var(--color-primary-light);
}

.McKinseyTable thead {
  background: linear-gradient(180deg, #0066cc 0%, #0055bb 100%);
  border-bottom: 2px solid #0055bb;
}

.McKinseyTable thead th {
  padding: var(--space-md) var(--space-lg);
  text-align: center;
  font-weight: 600;
  color: white;
  font-size: 0.875rem;
  text-transform: uppercase;
  letter-spacing: 0.1em;
  border-right: 1px solid rgba(255, 255, 255, 0.1);
}

.McKinseyTable thead th:last-child {
  border-right: none;
}

.McKinseyTable tbody tr {
  border-bottom: 1px solid var(--color-neutral-200);
  transition: background-color 0.2s ease;
}

.McKinseyTable tbody tr:hover {
  background-color: var(--color-primary-light);
}

.McKinseyTable tbody tr:last-child {
  border-bottom: none;
}

.McKinseyTable td {
  padding: var(--space-md);
  text-align: center;
  color: var(---color-text-primary);
  font-size: 0.9rem;
  border-right: 1px solid var(--color-neutral-100);
}

.McKinseyTable td:last-child {
  border-right: none;
}

.McKinseyTable td.number-cell {
  font-family: 'SFMono-Regular', Consolas, 'Liberation Mono', Menlo, monospace;
  font-weight: 600;
  color: var(--color-primary);
}

.McKinseyTable td.text-cell {
  text-align: left;
}

.McKinseyTable td.badge {
  display: display: inline-flex;
  align-items: center;
  gap: var(--space-xs);
  padding: var(--space-xs) var(-- space-sm);
  font-size: 0.75rem;
  font-weight: 500;
  border-radius: var(--radius-xs);
  text-transform: uppercase;
  letter-spacing: 0.05em;
}

.McKinseyTable .badge-success {
  background-color: var(--color-success-bg);
  color: var(--color-success);
}

.McKinseyTable .badge-warning {
  background-color: var(--color-warning-bg);
  color: var(--color-warning);
}

.McKinseyTable .badge-danger {
  background-color: var(--color-danger-bg);
  color: var(--color-danger);
}

/* Compact variant */
.McKinseyTable.compact thead th,
.McKinseyTable.compact td {
  padding: var(--space-sm) var(--space-md);
  font-size: 0.8rem;
}

.McKinseyTable.compact td.number-cell {
  font-size: 0.8rem;
}

.McKinseyTable.compact td.badge {
  font-size: 0.7rem;
  padding: 2px 6px;
}

/* Hover effects */
.McKinseyTable tbody tr:hover td {
  font-weight: 500;
  color: var(--color-primary-dark);
}

.McKinseyTable tbody tr:hover .badge {
  background-color: var(--color-primary);
  color: white;
}

.McKinseyTable tbody tr:hover .badge-success {
  background-color: var(--color-success);
}

.McKinseyTable tbody tr:hover .badge-warning {
  background-color: var(--color-warning);
}

.McKinseyTable tbody tr:hover .badge-danger {
  background-color: var(--color-danger);
}

/* Empty State */
.McKinseyTable .empty {
  padding: 3rem;
  text-align: center;
  color: var(--color-text-muted);
  font-style: italic;
  font-size: 0.95rem;
}

/* Striped Rows */
.McKinseyTable tbody tr:nth-child(even) {
  background-color: var(--color-neutral-50);
}

/* Rank Highlighting */
.McKinseyTable .rank-1 td {
  font-weight: 600;
  color: #d97706;
}

.McKinseyTable .rank-2 td {
  font-weight: 500;
  color: #777777;
}

.McKinseyTable .rank-3 td {
  font-weight: 500;
  color: #999999;
}

/* Responsive */
@media (max-width: 768px) {
  .McKinseyTable {
    font-size: 0.875rem;
  }

  .McKinseyTable thead th,
  .McKinseyTable td {
    padding: var(--space-sm) var(--space-md);
  }

  .McKinseyTable thead th {
    font-size: 0.75rem;
  }
  
  .McKinseyTable .rank-1 .rank-1,
  .McKinseyTable .rank-2 .rank-2,
  .McKinsey-Table .rank-3 .rank-3 {
    color: inherit;
  }
}