import React, { useState } from 'react';
import { Status} from '../../../models/Billing';
import { CustomerInstallmentData } from '../../../models/Customers';
import { InstallmentTable, InstallmentHeaderCell, InstallmentRow, AddInstallmentButton } from '../CustomerStyle';
import {Box, TableBody, TableCell, TableHead, TableRow, Typography, TextField, TableContainer, IconButton} from '@mui/material';
import { Add as AddIcon, CalendarToday as CalendarIcon, Edit as EditIcon, Check as CheckIcon, Close as CloseIcon } from '@mui/icons-material';
import { useNotification } from '../../../services/notificationService';

interface Installment {
  date: string;
  amount: string;
}

interface Props {
  status: Status;
  installmentData: CustomerInstallmentData;
  newInstallment: Installment;
  setNewInstallment: React.Dispatch<React.SetStateAction<Installment>>;
  handleAddInstallment: () => void;
  onUpdateInstallment?: (invoiceNo: string, installmentNo: number, date: string, amount: string) => Promise<void>;
}

const dateToInput = (ddmmyyyy: string) => {
  if (!ddmmyyyy) return '';
  const parts = ddmmyyyy.split('-');
  if (parts.length !== 3) return ddmmyyyy;
  const [d, m, y] = parts;
  return `${y}-${m.padStart(2, '0')}-${d.padStart(2, '0')}`;
};

const inputToDate = (yyyyMMdd: string) => {
  if (!yyyyMMdd) return '';
  const [y, m, d] = yyyyMMdd.split('-');
  return `${d}-${m}-${y}`;
};

const InstallmentScrollableTable: React.FC<Props> = ({
  status,
  installmentData,
  newInstallment,
  setNewInstallment,
  handleAddInstallment,
  onUpdateInstallment,
}) => {
  const { showError } = useNotification();
  const [editing, setEditing] = useState<{ installmentNo: number; date: string; amount: string } | null>(null);

  const handleEdit = (inst: { installmentNo: number; date: string; amount: string }) => {
    setEditing({
      installmentNo: inst.installmentNo,
      date: dateToInput(inst.date),
      amount: String(inst.amount).replace(/,/g, ''),
    });
  };

  const handleSaveEdit = async () => {
    if (!editing || !onUpdateInstallment) return;
    const amountNum = parseFloat(editing.amount);
    if (isNaN(amountNum) || amountNum <= 0) {
      showError('Please enter a valid amount');
      return;
    }
    await onUpdateInstallment(
      installmentData.invoiceNo,
      editing.installmentNo,
      inputToDate(editing.date),
      editing.amount
    );
    setEditing(null);
  };

  const normalizedBalance =
    installmentData.balance <= 0 ? 0 : installmentData.balance;


  return (
    <>
      <TableContainer
        sx={{
          maxHeight: installmentData.installments.length > 5 ? 225 : 'unset',
          overflowY: installmentData.installments.length > 5 ? 'auto' : 'visible',
        }}
      >
        <InstallmentTable>
          <TableHead>
            <TableRow>
              <InstallmentHeaderCell sx={{ width: '30%' }}>
                Installments
              </InstallmentHeaderCell>
              <InstallmentHeaderCell sx={{ width: '35%' }}>
                Date
              </InstallmentHeaderCell>
              <InstallmentHeaderCell sx={{ width: '35%' }}>
                Amount
              </InstallmentHeaderCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {/* Add New Installment Row */}
            {status === 'Pending' && (
              <InstallmentRow>
                <TableCell sx={{
                  fontSize: '13px',
                  padding: '8px 12px',
                  borderTop: '1px solid #e0e0e0',
                  borderBottom: '1px solid #e0e0e0',
                  borderLeft: '1px solid #e0e0e0',
                  borderRight: '1px solid #e0e0e0',
                  fontWeight: 600,
                }}>
                  {installmentData.installments.length + 1}
                </TableCell>
                <TableCell sx={{
                  padding: '6px 8px',
                  borderTop: '1px solid #e0e0e0',
                  borderBottom: '1px solid #e0e0e0',
                  borderLeft: '1px solid #e0e0e0',
                  borderRight: '1px solid #e0e0e0',
                }}>
                  <TextField
                    type="date"
                    value={newInstallment.date}
                    onChange={(e) => setNewInstallment({
                      ...newInstallment,
                      date: e.target.value
                    })}
                    size="small"
                    InputProps={{
                      sx: {
                        fontSize: '13px',
                        height: '32px',
                        backgroundColor: '#fff',
                        '& input': {
                          padding: '6px 8px',
                        },
                      },
                    }}
                    sx={{
                      width: '100%',
                      '& .MuiOutlinedInput-root': {
                        '& fieldset': {
                          borderColor: '#d3d3d3',
                        },
                        '&:hover fieldset': {
                          borderColor: '#b0b0b0',
                        },
                        '&.Mui-focused fieldset': {
                          borderColor: '#7c3aed',
                          borderWidth: '1px',
                        },
                      },
                    }}
                  />
                </TableCell>
                <TableCell sx={{
                  padding: '6px 8px',
                  borderTop: '1px solid #e0e0e0',
                  borderBottom: '1px solid #e0e0e0',
                  borderLeft: '1px solid #e0e0e0',
                  borderRight: '1px solid #e0e0e0',
                }}>
                  <Box sx={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                    <TextField
                      type="text"
                      value={newInstallment.amount}
                      onChange={(e) => {
                        const value = e.target.value.replace(/[^0-9.]/g, '');
                        setNewInstallment({
                          ...newInstallment,
                          amount: value
                        });
                      }}
                      placeholder="Amount"
                      size="small"
                      InputProps={{
                        startAdornment: (
                          <Typography sx={{ fontSize: '13px', color: '#666', mr: 0.5 }}>
                            ₹
                          </Typography>
                        ),
                        sx: {
                          fontSize: '13px',
                          height: '32px',
                          backgroundColor: '#fff',
                          '& input': {
                            padding: '6px 8px',
                          },
                        },
                      }}
                      sx={{
                        flex: 1,
                        '& .MuiOutlinedInput-root': {
                          '& fieldset': {
                            borderColor: '#d3d3d3',
                          },
                          '&:hover fieldset': {
                            borderColor: '#b0b0b0',
                          },
                          '&.Mui-focused fieldset': {
                            borderColor: '#7c3aed',
                            borderWidth: '1px',
                          },
                        },
                      }}
                    />
                    <AddInstallmentButton
                      size="small"
                      onClick={handleAddInstallment}
                    >
                      <AddIcon sx={{ fontSize: '18px' }} />
                    </AddInstallmentButton>
                  </Box>
                </TableCell>
              </InstallmentRow>
            )}
            {/* Existing Installments */}
            {installmentData.installments.map((inst) => {
              const isEditing = editing?.installmentNo === inst.installmentNo;
              return (
                <InstallmentRow key={inst.installmentNo}>
                  <TableCell sx={{
                    fontSize: '13px',
                    padding: '8px 12px',
                    borderTop: '1px solid #e0e0e0',
                    borderBottom: '1px solid #e0e0e0',
                    borderLeft: '1px solid #e0e0e0',
                    borderRight: '1px solid #e0e0e0',
                  }}>
                    {inst.installmentNo}
                  </TableCell>
                  <TableCell sx={{
                    padding: '6px 8px',
                    borderTop: '1px solid #e0e0e0',
                    borderBottom: '1px solid #e0e0e0',
                    borderLeft: '1px solid #e0e0e0',
                    borderRight: '1px solid #e0e0e0',
                  }}>
                    {isEditing && editing ? (
                      <TextField
                        type="date"
                        size="small"
                        value={editing.date}
                        onChange={(e) => setEditing({ ...editing, date: e.target.value })}
                        InputProps={{ sx: { fontSize: '13px', height: '32px' } }}
                        sx={{ width: '100%' }}
                      />
                    ) : (
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <CalendarIcon sx={{ fontSize: '14px', color: '#999' }} />
                        {inst.date}
                      </Box>
                    )}
                  </TableCell>
                  <TableCell sx={{
                    padding: '6px 8px',
                    borderTop: '1px solid #e0e0e0',
                    borderBottom: '1px solid #e0e0e0',
                    borderLeft: '1px solid #e0e0e0',
                    borderRight: '1px solid #e0e0e0',
                  }}>
                    {isEditing && editing ? (
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <TextField
                          size="small"
                          value={editing.amount}
                          onChange={(e) => {
                            const v = e.target.value.replace(/[^0-9.]/g, '');
                            setEditing({ ...editing, amount: v });
                          }}
                          InputProps={{
                            startAdornment: <Typography sx={{ fontSize: '13px', mr: 0.5 }}>₹</Typography>,
                            sx: { fontSize: '13px', height: '32px' },
                          }}
                          sx={{ width: 120 }}
                        />
                        <IconButton size="small" onClick={handleSaveEdit} sx={{ color: '#4caf50' }} title="Save">
                          <CheckIcon fontSize="small" />
                        </IconButton>
                        <IconButton size="small" onClick={() => setEditing(null)} sx={{ color: '#666' }} title="Cancel">
                          <CloseIcon fontSize="small" />
                        </IconButton>
                      </Box>
                    ) : (
                      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                        <span>₹{inst.amount}</span>
                        {status === 'Pending' && onUpdateInstallment && (
                          <IconButton size="small" onClick={() => handleEdit(inst)} sx={{ color: '#666' }} title="Edit">
                            <EditIcon sx={{ fontSize: '16px' }} />
                          </IconButton>
                        )}
                      </Box>
                    )}
                  </TableCell>
                </InstallmentRow>
              );
            })}
          </TableBody>
        </InstallmentTable>
      </TableContainer>
      <InstallmentTable>
        {/* Total Purchase Amount Row */}
        <InstallmentRow>
          <TableCell
            sx={{
              fontSize: '14px',
              fontWeight: 600,
              padding: '10px 12px',
              borderTop: '1px solid #e0e0e0',
              borderBottom: '1px solid #e0e0e0',
              borderLeft: '1px solid #e0e0e0',
              borderRight: '1px solid #e0e0e0',
              backgroundColor: '#f9f9f9',
              width: "65%"
            }}
          >
            Total
          </TableCell>
          <TableCell sx={{
            fontSize: '14px',
            fontWeight: 600,
            padding: '10px 12px',
            borderTop: '1px solid #e0e0e0',
            borderBottom: '1px solid #e0e0e0',
            borderLeft: '1px solid #e0e0e0',
            borderRight: '1px solid #e0e0e0',
            backgroundColor: '#f9f9f9',
            width: "35%"
          }}>
            ₹{(installmentData.totalPurchaseAmount ?? 0).toLocaleString('en-IN', {
              minimumFractionDigits: 2,
              maximumFractionDigits: 2
            })}
          </TableCell>
        </InstallmentRow>
        {/* Balance Row */}
        <InstallmentRow>
          <TableCell
            sx={{
              fontSize: '14px',
              fontWeight: 600,
              padding: '10px 12px',
              borderTop: '1px solid #e0e0e0',
              borderBottom: '1px solid #e0e0e0',
              borderLeft: '1px solid #e0e0e0',
              borderRight: '1px solid #e0e0e0',
              backgroundColor: '#f9f9f9',
              width: "65%"
            }}
          >
            Balance
          </TableCell>
          <TableCell sx={{
            fontSize: '14px',
            fontWeight: 600,
            padding: '10px 12px',
            borderTop: '1px solid #e0e0e0',
            borderBottom: '1px solid #e0e0e0',
            borderLeft: '1px solid #e0e0e0',
            borderRight: '1px solid #e0e0e0',
            backgroundColor: '#f9f9f9',
            width: "35%"
          }}>
            ₹{normalizedBalance.toLocaleString('en-IN', {
              minimumFractionDigits: 2,
              maximumFractionDigits: 2
            })}
          </TableCell>
        </InstallmentRow>
      </InstallmentTable>
    </>
  )
}

export default InstallmentScrollableTable