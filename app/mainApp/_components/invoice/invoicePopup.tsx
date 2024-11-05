import React, { useState } from "react";
import { Tile, Card } from "../../page"; // Adjust the path according to your directory structure
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

interface InvoicePopupProps {
  tiles: Tile[];
  isOpen: boolean;
  onClose: () => void;
}

const InvoicePopup: React.FC<InvoicePopupProps> = ({
  tiles,
  isOpen,
  onClose,
}) => {
  const [selectedCards, setSelectedCards] = useState<Card[]>([]);
  const [cardPrices, setCardPrices] = useState<{ [key: string]: number }>({});
  const [invoiceData, setInvoiceData] = useState({
    supplierName: "",
    supplierAddress: "",
    supplierPostal: "",
    supplierCity: "",
    supplierCountry: "",
    supplierCourt: "",
    supplierID: "",
    bankAccount: "",
    bankName: "",
    IBAN: "",
    SWIFT: "",
    clientName: "",
    clientAddress: "",
    clientPostal: "",
    clientCity: "",
    clientCountry: "",
    clientID: "",
    clientVAT: "",
    paymentType: "",
    paymentSymbol: "",
    invoiceNumber: "",
    issueDate: "",
    dueDate: "",
    totalAmount: 0,
    totalDue: 0,
    note: "",
    logo: "",
    logoWidth: 0,
    logoHeight: 0,
  });

  const handleCardSelection = (card: Card) => {
    setSelectedCards((prev) =>
      prev.includes(card) ? prev.filter((c) => c !== card) : [...prev, card]
    );
  };

  const handlePriceChange = (cardId: string, price: number) => {
    setCardPrices((prev) => ({ ...prev, [cardId]: price }));
  };

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setInvoiceData((prev) => ({ ...prev, [name]: value }));
  };

  const handleLogoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        const img = new Image();
        img.src = reader.result as string;
        img.onload = () => {
          const aspectRatio = img.width / img.height;
          const maxWidth = 25;
          const maxHeight = 25;
          let width = maxWidth;
          let height = maxHeight;

          if (aspectRatio > 1) {
            height = maxWidth / aspectRatio;
          } else {
            width = maxHeight * aspectRatio;
          }

          setInvoiceData((prev) => ({
            ...prev,
            logo: reader.result as string,
            logoWidth: width,
            logoHeight: height,
          }));
        };
      };
      reader.readAsDataURL(file);
    }
  };

  const handleExportPDF = () => {
    const doc = new jsPDF();
    let finalY = 130; // Initial Y position for the table

    if (invoiceData.logo) {
      doc.addImage(
        invoiceData.logo,
        "PNG",
        77,
        27,
        invoiceData.logoWidth,
        invoiceData.logoHeight
      );
    }

    // Set general styles
    doc.setDrawColor(0, 0, 0); // Black color for lines

    // Add header lines and title
    doc.setFontSize(10);
    doc.setFont("helvetica", "bold");
    doc.text("INVOICE", 20, 20);
    doc.text(`Invoice Number: ${invoiceData.invoiceNumber}`, 150, 20, {
      align: "right",
    });

    doc.line(20, 25, 190, 25); // Line under header

    // Supplier section (left side)
    doc.setFontSize(12);
    doc.setFont("helvetica", "bold");
    doc.text(`${invoiceData.supplierName}`, 20, 35);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(10);

    doc.text(`${invoiceData.supplierAddress}`, 20, 40);
    doc.text(`${invoiceData.clientPostal} ${invoiceData.clientCity}`, 20, 45);
    doc.text(`${invoiceData.supplierCountry}`, 20, 50);

    doc.text(`Registration: ${invoiceData.supplierCourt}`, 20, 60);
    doc.text(`Company ID: ${invoiceData.supplierID}`, 20, 65);

    // Bank details
    doc.text(`Bank: ${invoiceData.bankName}`, 20, 75);
    doc.text(`Account Number: ${invoiceData.bankAccount}`, 20, 80);
    doc.text(`IBAN: ${invoiceData.IBAN}`, 20, 85);
    doc.text(`SWIFT: ${invoiceData.SWIFT}`, 20, 90);

    doc.rect(15, 25, 90, 80);

    // Client section (right side)
    doc.setFont("helvetica", "bold");
    doc.text("Purchaser", 110, 35);
    doc.setFont("helvetica", "normal");
    doc.text(`Company ID: ${invoiceData.clientID}`, 110, 40);
    doc.text(`Vat ID: ${invoiceData.clientVAT}`, 110, 45);
    doc.text(invoiceData.clientName, 110, 55);
    doc.text(invoiceData.clientAddress, 110, 60);
    doc.text(`${invoiceData.clientPostal} ${invoiceData.clientCity}`, 110, 65);
    doc.text(invoiceData.clientCountry, 110, 70);
    doc.text(`Variable Symbol: ${invoiceData.paymentSymbol}`, 110, 80);
    doc.text(`Payment type: ${invoiceData.paymentType}`, 110, 85);

    doc.rect(105, 25, 90, 80);

    // Invoice details
    doc.line(15, 105, 195, 105); // Line under supplier and client details
    doc.setFontSize(10);
    doc.text(`Issue date: ${invoiceData.issueDate}`, 30, 110);
    doc.text(`Due date: ${invoiceData.dueDate}`, 120, 110);

    doc.line(20, 115, 190, 115); // Line before table

    // Table Header
    doc.setFont("helvetica", "bold");
    doc.setFontSize(10);
    const headers = [
      "Item Description",
      "QTY",
      "Price per Unit",
      "Total Price",
    ];
    let startX = 20;
    headers.forEach((header, index) => {
      doc.text(header, startX, 120);
      startX += index === 0 ? 80 : index === 1 ? 20 : 40; // Adjust spacing for each column
    });
    doc.line(20, 130, 190, 130); // Line after table header

    // Table rows
    doc.setFont("helvetica", "normal");
    const tableData = selectedCards.map((card) => [
      card.description,
      "1",
      cardPrices[card.id] || 0,
      cardPrices[card.id] || 0,
    ]);

    let rowY = 135;
    tableData.forEach((row) => {
      startX = 20;
      row.forEach((text, index) => {
        doc.text(String(text), startX, rowY);
        startX += index === 0 ? 100 : 20; // Adjust for wider first column
      });
      rowY += 10;
      doc.line(20, rowY - 5, 190, rowY - 5); // Line after each row
    });

    finalY = rowY; // Update finalY based on last row position

    // Add summary box
    doc.line(130, finalY, 190, finalY); // Top line of summary box
    doc.line(130, finalY, 130, finalY + 20); // Left line of summary box
    doc.line(190, finalY, 190, finalY + 20); // Right line of summary box
    doc.line(130, finalY + 20, 190, finalY + 20); // Bottom line of summary box
    const totalAmount = selectedCards.reduce(
      (sum, card) => sum + (cardPrices[card.id] || 0),
      0
    );
    doc.text(`Total: ${totalAmount.toFixed(2)} CZK`, 135, finalY + 10);

    // Add supplier sign box
    doc.line(20, finalY, 80, finalY); // Top line of sign box
    doc.line(20, finalY, 20, finalY + 40); // Left line of sign box
    doc.line(80, finalY, 80, finalY + 40); // Right line of sign box
    doc.line(20, finalY + 40, 80, finalY + 40); // Bottom line of sign box
    doc.text("Supplier Sign", 25, finalY + 10);

    // Add note section
    doc.setFont("helvetica", "bold");
    doc.text("Note:", 20, finalY + 50);
    doc.setFont("helvetica", "normal");
    doc.text(invoiceData.note, 20, finalY + 55, { maxWidth: 170 });

    // Save the PDF
    doc.save("invoice.pdf");
  };

  if (!isOpen) return null;

  return (
    <>
      <div className="fixed inset-0 flex items-center justify-center z-50 bg-black bg-opacity-50">
        <div className="bg-white p-6 rounded-2xl shadow-lg w-full max-w-4xl max-h-[90vh] overflow-y-auto custom-scrollbar">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-bold">Create Invoice</h2>
            <button
              className="text-red-500 hover:text-red-700"
              onClick={onClose}
            >
              ✖
            </button>
          </div>

          {/* Supplier Info */}
          <div className="grid grid-cols-2 gap-4 mb-4">
            <div>
              <h3 className="text-lg font-bold mb-2">Supplier Information</h3>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label>Name:</label>
                  <input
                    name="supplierName"
                    onChange={handleInputChange}
                    className="border p-2 rounded w-full mb-2"
                  />
                  <label>Address:</label>
                  <input
                    name="supplierAddress"
                    onChange={handleInputChange}
                    className="border p-2 rounded w-full mb-2"
                  />
                  <label>Postal Code:</label>
                  <input
                    name="supplierPostal"
                    onChange={handleInputChange}
                    className="border p-2 rounded w-full mb-2"
                  />
                  <label>City:</label>
                  <input
                    name="supplierCity"
                    onChange={handleInputChange}
                    className="border p-2 rounded w-full mb-2"
                  />
                  <label>Country:</label>
                  <input
                    name="supplierCountry"
                    onChange={handleInputChange}
                    className="border p-2 rounded w-full mb-2"
                  />
                  <label>Court Registration:</label>
                  <input
                    name="supplierCourt"
                    onChange={handleInputChange}
                    className="border p-2 rounded w-full mb-2"
                  />
                </div>
                <div>
                  <label>ID:</label>
                  <input
                    name="supplierID"
                    onChange={handleInputChange}
                    className="border p-2 rounded w-full mb-2"
                  />
                  <label>Bank Account:</label>
                  <input
                    name="bankAccount"
                    onChange={handleInputChange}
                    className="border p-2 rounded w-full mb-2"
                  />
                  <label>Bank Name:</label>
                  <input
                    name="bankName"
                    onChange={handleInputChange}
                    className="border p-2 rounded w-full mb-2"
                  />
                  <label>IBAN:</label>
                  <input
                    name="IBAN"
                    onChange={handleInputChange}
                    className="border p-2 rounded w-full mb-2"
                  />
                  <label>SWIFT:</label>
                  <input
                    name="SWIFT"
                    onChange={handleInputChange}
                    className="border p-2 rounded w-full mb-2"
                  />
                  <label>Company Logo:</label>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleLogoChange}
                    className="border p-2 rounded w-full"
                  />
                </div>
              </div>
            </div>

            {/* Client Info */}
            <div>
              <h3 className="text-lg font-bold mb-2">Client Information</h3>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label>Name:</label>
                  <input
                    name="clientName"
                    onChange={handleInputChange}
                    className="border p-2 rounded w-full mb-2"
                  />
                  <label>Address:</label>
                  <input
                    name="clientAddress"
                    onChange={handleInputChange}
                    className="border p-2 rounded w-full mb-2"
                  />
                  <label>Postal Code:</label>
                  <input
                    name="clientPostal"
                    onChange={handleInputChange}
                    className="border p-2 rounded w-full mb-2"
                  />
                  <label>City:</label>
                  <input
                    name="clientCity"
                    onChange={handleInputChange}
                    className="border p-2 rounded w-full mb-2"
                  />
                  <label>Country:</label>
                  <input
                    name="clientCountry"
                    onChange={handleInputChange}
                    className="border p-2 rounded w-full mb-2"
                  />
                </div>
                <div>
                  <label>ID:</label>
                  <input
                    name="clientID"
                    onChange={handleInputChange}
                    className="border p-2 rounded w-full mb-2"
                  />
                  <label>VAT:</label>
                  <input
                    name="clientVAT"
                    onChange={handleInputChange}
                    className="border p-2 rounded w-full mb-2"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Invoice Info */}
          <div className="grid grid-cols-2 gap-4 mb-4">
            <div>
              <h3 className="text-lg font-bold mb-2">Invoice Information</h3>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label>Invoice Number:</label>
                  <input
                    name="invoiceNumber"
                    onChange={handleInputChange}
                    className="border p-2 rounded w-full mb-2"
                  />
                  <label>Issue Date:</label>
                  <input
                    name="issueDate"
                    type="date"
                    onChange={handleInputChange}
                    className="border p-2 rounded w-full mb-2"
                  />
                </div>
                <div>
                  <label>Due Date:</label>
                  <input
                    name="dueDate"
                    type="date"
                    onChange={handleInputChange}
                    className="border p-2 rounded w-full mb-2"
                  />
                  <label>Payment Type:</label>
                  <input
                    name="paymentType"
                    onChange={handleInputChange}
                    className="border p-2 rounded w-full mb-2"
                  />
                  <label>Payment Symbol:</label>
                  <input
                    name="paymentSymbol"
                    onChange={handleInputChange}
                    className="border p-2 rounded w-full mb-2"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Item Selection */}
          <div className="mb-4">
            <h3 className="text-lg font-bold mb-2">Select Items</h3>
            {tiles.map((tile) =>
              tile.cards.map((card) => (
                <div key={card.id} className="flex items-center mb-2">
                  <input
                    type="checkbox"
                    checked={selectedCards.includes(card)}
                    onChange={() => handleCardSelection(card)}
                    className="mr-2"
                  />
                  <span className="mr-2">{card.name}</span>
                  <input
                    type="number"
                    placeholder="Price"
                    value={cardPrices[card.id] || ""}
                    onChange={(e) =>
                      handlePriceChange(card.id, parseFloat(e.target.value))
                    }
                    className="border p-2 rounded w-24"
                  />
                </div>
              ))
            )}
          </div>

          {/* Note Section */}
          <div className="mb-4">
            <h3 className="text-lg font-bold mb-2">Note</h3>
            <textarea
              name="note"
              onChange={handleInputChange}
              className="border p-2 rounded w-full"
              rows={4}
            />
          </div>

          {/* Export and Close Buttons */}
          <div className="flex justify-end space-x-2">
            <button
              className="bg-blue-500 text-white p-2 rounded"
              onClick={handleExportPDF}
            >
              Export PDF
            </button>
            <button
              className="bg-red-500 text-white p-2 rounded"
              onClick={onClose}
            >
              Cancel
            </button>
          </div>
        </div>
      </div>
      <style jsx>{`
        .custom-scrollbar::-webkit-scrollbar {
          width: 12px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: #f1f1f1;
          border-radius: 10px;
          margin: 10px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: #888;
          border-radius: 10px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: #555;
        }
      `}</style>
    </>
  );
};

export default InvoicePopup;
