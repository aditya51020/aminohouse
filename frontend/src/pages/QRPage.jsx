import React, { useRef, useState } from 'react';
import { QRCodeCanvas } from 'qrcode.react';
import { Download, Printer, RefreshCw } from 'lucide-react';

const QRPage = () => {
    // Change this to your production URL when you deploy
    const defaultUrl = `${window.location.origin}/menu`;
    const [menuUrl, setMenuUrl] = useState(defaultUrl);
    const [cafeName, setCafeName] = useState('Scan to Order');
    const [tableLabel, setTableLabel] = useState('');
    const qrRef = useRef(null);

    const handleDownload = () => {
        const canvas = qrRef.current?.querySelector('canvas');
        if (!canvas) return;
        const link = document.createElement('a');
        link.download = `menu-qr${tableLabel ? `-table${tableLabel}` : ''}.png`;
        link.href = canvas.toDataURL('image/png');
        link.click();
    };

    const handlePrint = () => {
        const canvas = qrRef.current?.querySelector('canvas');
        if (!canvas) return;
        const imgData = canvas.toDataURL('image/png');
        const printWindow = window.open('', '', 'height=700,width=500');
        printWindow.document.write(`
            <html><head><title>Menu QR Code</title>
            <style>
                body { font-family: sans-serif; text-align: center; padding: 40px; }
                img { width: 280px; height: 280px; }
                h2 { font-size: 22px; margin-bottom: 4px; }
                p { color: #555; font-size: 14px; margin: 4px 0; }
                .border-box { border: 2px dashed #ccc; padding: 30px; display: inline-block; border-radius: 16px; margin-top: 20px; }
            </style></head><body>
            <div class="border-box">
                <h2>${cafeName}</h2>
                ${tableLabel ? `<p>Table ${tableLabel}</p>` : ''}
                <br/>
                <img src="${imgData}" />
                <br/><br/>
                <p>📱 Scan to view menu & order</p>
                <p style="font-size:11px; color:#aaa;">${menuUrl}</p>
            </div>
            </body></html>
        `);
        printWindow.document.close();
        printWindow.print();
    };

    return (
        <div className="min-h-screen bg-gray-50 p-6">
            <div className="max-w-2xl mx-auto">
                {/* Header */}
                <div className="mb-8">
                    <h1 className="text-3xl font-black text-gray-900">QR Code Generator</h1>
                    <p className="text-gray-500 mt-1">Cafe mein print karke lagao — customers scan karke order kar sakenge</p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

                    {/* Settings Panel */}
                    <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6 space-y-5">
                        <h2 className="font-bold text-gray-800 text-lg">Settings</h2>

                        <div>
                            <label className="block text-xs font-semibold text-gray-500 mb-1.5 uppercase tracking-wide">Menu URL</label>
                            <input
                                type="text"
                                value={menuUrl}
                                onChange={e => setMenuUrl(e.target.value)}
                                className="w-full border rounded-xl px-4 py-2.5 text-sm focus:ring-2 focus:ring-blue-500 outline-none bg-gray-50"
                            />
                            <button
                                onClick={() => setMenuUrl(defaultUrl)}
                                className="mt-1.5 text-xs text-blue-600 hover:underline flex items-center gap-1"
                            >
                                <RefreshCw size={11} /> Reset to current URL
                            </button>
                        </div>

                        <div>
                            <label className="block text-xs font-semibold text-gray-500 mb-1.5 uppercase tracking-wide">Cafe / Heading Text</label>
                            <input
                                type="text"
                                value={cafeName}
                                onChange={e => setCafeName(e.target.value)}
                                className="w-full border rounded-xl px-4 py-2.5 text-sm focus:ring-2 focus:ring-blue-500 outline-none bg-gray-50"
                                placeholder="e.g. Scan to Order"
                            />
                        </div>

                        <div>
                            <label className="block text-xs font-semibold text-gray-500 mb-1.5 uppercase tracking-wide">Table Number <span className="text-gray-400 font-normal">(optional)</span></label>
                            <input
                                type="text"
                                value={tableLabel}
                                onChange={e => setTableLabel(e.target.value)}
                                className="w-full border rounded-xl px-4 py-2.5 text-sm focus:ring-2 focus:ring-blue-500 outline-none bg-gray-50"
                                placeholder="e.g. 5 (alag QR per table)"
                            />
                        </div>

                        <div className="pt-2 flex flex-col gap-2">
                            <button
                                onClick={handleDownload}
                                className="w-full flex items-center justify-center gap-2 bg-black text-white py-3 rounded-xl font-bold hover:bg-gray-800 transition"
                            >
                                <Download size={18} /> Download PNG
                            </button>
                            <button
                                onClick={handlePrint}
                                className="w-full flex items-center justify-center gap-2 bg-white border border-gray-300 text-gray-700 py-3 rounded-xl font-bold hover:bg-gray-50 transition"
                            >
                                <Printer size={18} /> Print QR
                            </button>
                        </div>
                    </div>

                    {/* QR Preview */}
                    <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6 flex flex-col items-center justify-center">
                        <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-4">Preview</p>

                        <div className="border-2 border-dashed border-gray-200 rounded-2xl p-6 flex flex-col items-center gap-3 w-full">
                            <p className="font-bold text-gray-800 text-lg text-center">{cafeName || 'Scan to Order'}</p>
                            {tableLabel && (
                                <p className="text-sm text-gray-500">Table {tableLabel}</p>
                            )}

                            <div ref={qrRef} className="p-3 bg-white rounded-xl shadow-inner border">
                                <QRCodeCanvas
                                    value={menuUrl || defaultUrl}
                                    size={200}
                                    bgColor="#ffffff"
                                    fgColor="#000000"
                                    level="H"
                                    marginSize={2}
                                />
                            </div>

                            <p className="text-xs text-gray-400 text-center">📱 Scan to view menu & order</p>
                            <p className="text-[10px] text-gray-300 text-center break-all">{menuUrl}</p>
                        </div>
                    </div>

                </div>

                {/* Info box */}
                <div className="mt-6 bg-blue-50 border border-blue-100 rounded-2xl p-4">
                    <p className="text-sm font-semibold text-blue-700 mb-1">💡 How to use</p>
                    <ul className="text-xs text-blue-600 space-y-1 list-disc list-inside">
                        <li>Abhi local URL hai (<code>localhost:5173</code>) — jab deploy karo tab production URL daalna</li>
                        <li>Har table ke liye alag QR banana ho toh Table Number bhar do</li>
                        <li>Download karke print karo ya direct Print QR use karo</li>
                    </ul>
                </div>
            </div>
        </div>
    );
};

export default QRPage;
