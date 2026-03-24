import React, { useState } from 'react';
import { doc, setDoc, addDoc, deleteDoc, collection } from 'firebase/firestore';
import { Settings, LogOut, ChevronRight, Edit2, Trash2, Plus, Save, X } from 'lucide-react';

export default function AdminPanel({ services, user, db, appId }) {
  const [activeTab, setActiveTab] = useState('categories');
  const [editingId, setEditingId] = useState(null);
  const [editForm, setEditForm] = useState({});
  
  const handleToggleActive = async (collectionName, id, currentStatus) => {
    if(!user) return;
    await setDoc(doc(db, 'artifacts', appId, 'public', 'data', collectionName, id), { isActive: !currentStatus }, { merge: true });
  };

  const handleDelete = async (id) => {
    if(!user || !window.confirm('ยืนยันการลบ?')) return;
    await deleteDoc(doc(db, 'artifacts', appId, 'public', 'data', 'services', id));
  };

  const handleAddMock = async (type) => {
    if(!user) return;
    const payload = { docType: type, name: `บริการใหม่ (${type})`, isActive: true, order: 99 };
    if(type !== 'category') { payload.price = 500; payload.originalPrice = 600; payload.desc = "รายละเอียด..."; }
    if(type === 'type') payload.categoryId = services.categories[0]?.id || null;
    if(type === 'addon') payload.sizes = []; 
    const docRef = await addDoc(collection(db, 'artifacts', appId, 'public', 'data', 'services'), payload);
    startEdit({ id: docRef.id, ...payload });
  };

  const startEdit = (item) => {
    setEditingId(item.id);
    setEditForm({ ...item, sizes: item.sizes || [] });
  };

  const saveEdit = async () => {
    if(!user) return;
    const payload = { ...editForm };
    if (payload.price !== undefined) payload.price = Number(payload.price);
    if (payload.originalPrice !== undefined) payload.originalPrice = Number(payload.originalPrice);
    if (payload.order !== undefined) payload.order = Number(payload.order);
    if (payload.sizes?.length > 0) payload.sizes = payload.sizes.map(sz => ({ name: sz.name, price: Number(sz.price||0), originalPrice: Number(sz.originalPrice||0) }));
    await setDoc(doc(db, 'artifacts', appId, 'public', 'data', 'services', editingId), payload, { merge: true });
    setEditingId(null);
  };

  const renderList = (items, type) => (
    <div className="space-y-3">
      {items.map(item => {
        if (editingId === item.id) {
          return (
            <div key={item.id} className="bg-blue-50 p-5 rounded-2xl border border-blue-200 shadow-sm space-y-4">
              <div className="flex items-center gap-2 mb-2 font-bold text-[#000080]"><Edit2 size={16}/> แก้ไขข้อมูล</div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1"><label className="text-[10px] font-bold text-gray-500 uppercase">ชื่อบริการ</label><input type="text" value={editForm.name || ''} onChange={e => setEditForm({...editForm, name: e.target.value})} className="w-full p-2.5 border rounded-lg outline-none" /></div>
                {type === 'category' && <div className="space-y-1"><label className="text-[10px] font-bold text-gray-500 uppercase">ไอคอน (Emoji)</label><input type="text" value={editForm.icon || ''} onChange={e => setEditForm({...editForm, icon: e.target.value})} className="w-full p-2.5 border rounded-lg outline-none" /></div>}
                {(type === 'type' || type === 'addon') && (
                  <>
                    <div className="space-y-1"><label className="text-[10px] font-bold text-gray-500 uppercase">ราคาขายจริง</label><input type="number" value={editForm.price || ''} onChange={e => setEditForm({...editForm, price: e.target.value})} className="w-full p-2.5 border rounded-lg outline-none" /></div>
                    <div className="space-y-1"><label className="text-[10px] font-bold text-gray-500 uppercase">ราคาเต็ม</label><input type="number" value={editForm.originalPrice || ''} onChange={e => setEditForm({...editForm, originalPrice: e.target.value})} className="w-full p-2.5 border rounded-lg outline-none" /></div>
                    <div className="space-y-1 md:col-span-2"><label className="text-[10px] font-bold text-gray-500 uppercase">รายละเอียด</label><input type="text" value={editForm.desc || ''} onChange={e => setEditForm({...editForm, desc: e.target.value})} className="w-full p-2.5 border rounded-lg outline-none" /></div>
                  </>
                )}
                {type === 'addon' && (
                   <div className="md:col-span-2 space-y-2 mt-2 pt-2 border-t border-gray-200">
                     <label className="text-[10px] font-bold text-gray-500 uppercase text-[#1EA7E1]">จัดการขนาด/รูปแบบ (ถ้ามี)</label>
                     {editForm.sizes?.map((sz, idx) => (
                       <div key={idx} className="flex flex-col sm:flex-row gap-2 bg-gray-50 p-2 border border-gray-200 rounded-lg">
                         <input type="text" value={sz.name} onChange={(e) => { const newSizes = [...editForm.sizes]; newSizes[idx].name = e.target.value; setEditForm({...editForm, sizes: newSizes}); }} placeholder="ชื่อขนาด" className="flex-1 p-2 border rounded text-sm w-full outline-none" />
                         <input type="number" value={sz.price} onChange={(e) => { const newSizes = [...editForm.sizes]; newSizes[idx].price = e.target.value; setEditForm({...editForm, sizes: newSizes}); }} placeholder="ราคา" className="w-full sm:w-28 p-2 border rounded text-sm outline-none" />
                         <input type="number" value={sz.originalPrice} onChange={(e) => { const newSizes = [...editForm.sizes]; newSizes[idx].originalPrice = e.target.value; setEditForm({...editForm, sizes: newSizes}); }} placeholder="ราคาเต็ม" className="w-full sm:w-28 p-2 border rounded text-sm outline-none" />
                         <button onClick={() => { const newSizes = editForm.sizes.filter((_, i) => i !== idx); setEditForm({...editForm, sizes: newSizes}); }} className="p-2 text-red-500 bg-white border rounded hover:bg-red-50"><Trash2 size={16}/></button>
                       </div>
                     ))}
                     <button onClick={() => setEditForm({...editForm, sizes: [...(editForm.sizes || []), { name: '', price: 0, originalPrice: 0 }]})} className="text-sm text-[#1EA7E1] bg-blue-50 px-4 py-2 rounded-lg font-bold flex items-center gap-1 hover:bg-blue-100"><Plus size={14}/> เพิ่มขนาดใหม่</button>
                   </div>
                )}
                {type === 'type' && (
                   <div className="space-y-1"><label className="text-[10px] font-bold text-gray-500 uppercase">หมวดหมู่</label>
                      <select value={editForm.categoryId || ''} onChange={e => setEditForm({...editForm, categoryId: e.target.value})} className="w-full p-2.5 border rounded-lg bg-white outline-none">
                        <option value="">-- ไม่ระบุหมวดหมู่ --</option>
                        {services.categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                      </select>
                   </div>
                )}
              </div>
              <div className="flex justify-end gap-2 pt-4"><button onClick={() => setEditingId(null)} className="px-5 py-2 bg-white text-gray-600 border border-gray-200 rounded-lg font-bold flex gap-1 hover:bg-gray-50"><X size={16}/> ยกเลิก</button><button onClick={saveEdit} className="px-5 py-2 bg-[#1EA7E1] text-white rounded-lg font-bold flex gap-1 hover:bg-blue-600"><Save size={16}/> บันทึก</button></div>
            </div>
          );
        }

        return (
          <div key={item.id} className="bg-white p-4 rounded-xl border border-gray-200 flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="flex-1">
              <p className="font-bold text-gray-800">{item.name} {item.icon && <span>{item.icon}</span>}</p>
              {item.price !== undefined && <div className="flex gap-2 mt-1"><span className="text-sm text-[#1EA7E1] font-bold">ราคา: {item.price} ฿</span></div>}
              {type === 'addon' && item.sizes?.length > 0 && <div className="mt-2 flex flex-wrap gap-1.5">{item.sizes.map((sz, idx) => <span key={idx} className="bg-blue-50 text-[#1EA7E1] text-[10px] font-bold px-2 py-1 rounded-md border border-blue-100">{sz.name}: {sz.price}฿</span>)}</div>}
            </div>
            <div className="flex items-center gap-2 border-l border-gray-100 pl-4">
              <button onClick={() => startEdit(item)} className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg flex items-center gap-1 font-bold text-sm"><Edit2 size={16}/> แก้ไข</button>
              <button onClick={() => handleDelete(item.id)} className="p-2 text-red-500 hover:bg-red-50 rounded-lg"><Trash2 size={16}/></button>
            </div>
          </div>
        );
      })}
      <button onClick={() => handleAddMock(type)} className="w-full py-4 border-2 border-dashed border-gray-300 rounded-xl text-gray-500 font-bold hover:border-[#1EA7E1] hover:text-[#1EA7E1] hover:bg-blue-50 flex justify-center gap-2 mt-6 transition-colors"><Plus size={18}/> สร้างรายการใหม่</button>
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-100 text-gray-800 pb-24 font-sans">
      <header className="bg-[#000080] text-white p-4 flex justify-between items-center sticky top-0 z-50 shadow-md">
        <h1 className="font-bold flex items-center gap-3">
            <div className="bg-white p-1.5 rounded-lg shadow-sm">
                <img src="logo-cleanforce.png" alt="Cleanforce Admin" className="h-6 w-auto object-contain" />
            </div>
            <span className="hidden sm:inline">Admin Panel</span>
        </h1>
        <button onClick={() => window.location.hash = ''} className="bg-white/20 px-4 py-2 rounded-lg text-sm font-bold flex gap-2 hover:bg-white/30 transition-colors"><LogOut size={16}/> กลับไปหน้าจอง</button>
      </header>
      <div className="max-w-4xl mx-auto p-4 flex flex-col md:flex-row gap-6 mt-6">
        <div className="w-full md:w-64 space-y-2 shrink-0">
          {['categories', 'types', 'addons'].map(tab => (
            <button key={tab} onClick={() => { setActiveTab(tab); setEditingId(null); }} className={`w-full text-left p-3 rounded-lg font-bold flex justify-between transition-colors ${activeTab === tab ? 'bg-[#1EA7E1] text-white shadow-md' : 'bg-white text-gray-600 border border-gray-200 hover:bg-gray-50'}`}><span>จัดการ {tab}</span><ChevronRight size={16} className={activeTab === tab ? 'text-white' : 'text-gray-400'}/></button>
          ))}
        </div>
        <div className="flex-1">
           {activeTab === 'categories' && renderList(services.categories, 'category')}
           {activeTab === 'types' && renderList(services.types, 'type')}
           {activeTab === 'addons' && renderList(services.addons, 'addon')}
        </div>
      </div>
    </div>
  );
}