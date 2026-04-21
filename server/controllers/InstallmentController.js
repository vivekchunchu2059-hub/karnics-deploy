const fs = require('fs');
const path = require('path');
const { dataPath } = require('../paths');
const log = require('../logger');
const installmentFilePath = () => dataPath('Installments', 'Installments.json');

const ensureFile = (filePath) => {
    const dir = path.dirname(filePath);
    if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
    }
    if (!fs.existsSync(filePath)) {
        fs.writeFileSync(filePath, '[]', 'utf8');
    }
};

const readInstallments = () => {
    const fp = installmentFilePath();
    ensureFile(fp);
    const raw = fs.readFileSync(fp, 'utf8');
    return raw.trim() ? JSON.parse(raw) : [];
};

const writeInstallments = (data) => {
    const fp = installmentFilePath();
    ensureFile(fp);
    fs.writeFileSync(fp, JSON.stringify(data, null, 2), 'utf8');
};

const parseAmount = (value = 0) =>
    Number(String(value).replace(/,/g, "")) || 0;

const addInstallment = (req, res) => {
    log.info('Add Installment called...');
    try {
        const { id } = req.params;
        const { date, amount } = req.body;

        if (!id || !date || !amount) {
            return res.status(400).json({
                success: false,
                message: "invoiceNo, date and amount are required",
            });
        }

        const records = readInstallments(); //  array of records
        const index = records.findIndex(
            (r) => r.invoiceNo === id
        );

        if (index === -1) {
            return res.status(404).json({
                success: false,
                message: "Invoice not found",
            });
        }

        const record = records[index];

        if (parseAmount(record.balance) <= 0) {
            return res.status(400).json({
                success: false,
                message: "Balance already cleared",
            });
        }

        const installmentAmount = parseAmount(amount);
        const currentBalance = parseAmount(record.balance);
        // Allow small tolerance so paying exact balance (e.g. 0.01) isn't rejected by floating-point
        if (installmentAmount > currentBalance + 0.001) {
            return res.status(400).json({
                success: false,
                message: "Installment amount exceeds balance",
            });
        }

        //  next installment number
        const nextInstallmentNo =
            Math.max(
                0,
                ...record.installments.map((i) => i.installmentNo)
            ) + 1;

        const newInstallment = {
            installmentNo: nextInstallmentNo,
            date,
            amount: installmentAmount.toFixed(2),
        };

        //  update record
        record.installments.push(newInstallment);
        const newBalance = Math.max(0, Math.round((currentBalance - installmentAmount) * 100) / 100);
        record.balance = newBalance;

        //  persist
        records[index] = record;
        log.info('Installment added successfully');
        writeInstallments(records);

        return res.status(201).json({
            success: true,
            data: record,
        });
    } catch (error) {
        log.error("Failed to Add Installment:", error);
        return res.status(500).json({
            success: false,
            message: "Failed to Add Installment",
        });
    }
};

const updateInstallment = (req, res) => {
    log.info('Update Installment called...');
    try {
        const { invoiceId, installmentNo } = req.params;
        const { date, amount } = req.body;

        if (!invoiceId || !installmentNo || !date || amount == null) {
            return res.status(400).json({
                success: false,
                message: "invoiceId, installmentNo, date and amount are required",
            });
        }

        const records = readInstallments();
        const index = records.findIndex((r) => r.invoiceNo === invoiceId);
        if (index === -1) {
            return res.status(404).json({
                success: false,
                message: "Invoice not found",
            });
        }

        const record = records[index];
        const instNo = parseInt(installmentNo, 10);
        const instIndex = record.installments.findIndex((i) => i.installmentNo === instNo);
        if (instIndex === -1) {
            return res.status(404).json({
                success: false,
                message: "Installment not found",
            });
        }

        const oldAmount = parseAmount(record.installments[instIndex].amount);
        const newAmount = parseAmount(amount);
        record.installments[instIndex].date = date;
        record.installments[instIndex].amount = String(newAmount.toFixed(2));
        const rawBalance = parseAmount(record.balance) + oldAmount - newAmount;
        if (rawBalance < -0.001) {
            return res.status(400).json({
                success: false,
                message: "Update would make balance negative",
            });
        }
        record.balance = Math.max(0, Math.round(rawBalance * 100) / 100);

        records[index] = record;
        writeInstallments(records);
        log.info('Installment updated successfully');
        return res.status(200).json({
            success: true,
            data: record,
        });
    } catch (error) {
        log.error("Failed to Update Installment:", error);
        return res.status(500).json({
            success: false,
            message: "Failed to Update Installment",
        });
    }
};

const getInstallmentByInvoice = (invoice = "") => {
    const installmentData = readInstallments()
    if (!invoice || typeof invoice !== "string") {
        return {
            installments: [],
            balance: 0,
        };
    }
    const record = installmentData && installmentData.find(
        (item) => item.invoiceNo === invoice
    );
    log.info('Installment record:', record);
    if (!record) {
        return {
            installments: [],
            balance: 0,
        };
    }

    return {
        installments: (record.installments || []).map((inst) => ({
            installmentNo: inst.installmentNo,
            date: inst.date,
            amount: parseAmount(inst.amount),
        })),
        balance: Number(record.balance) || 0,
    };
};

module.exports = {
    addInstallment,
    updateInstallment,
    getInstallmentByInvoice,
    writeInstallments,
    readInstallments,
}