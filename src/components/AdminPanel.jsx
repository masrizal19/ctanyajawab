import React, { useState } from 'react';
import { saveQuiz, deleteQuiz } from '../services/quizService';

export default function AdminPanel({ quizList, reloadData }) {
  const [loading, setLoading] = useState(false);

  // HANDLER: TAMBAH KUIS BARU
  const handleCreateQuiz = async (newQuizData) => {
    setLoading(true);
    
    const result = await saveQuiz(newQuizData);
    setLoading(false);

    if (result.success) {
      alert("Kuis berhasil dibuat dan tersimpan!");
      if (reloadData) reloadData(); // Refresh UI Admin
    } else {
      alert(`Gagal membuat kuis: ${result.message}`);
    }
  };

  // HANDLER: HAPUS KUIS
  const handleDeleteQuiz = async (id, title) => {
    if (!window.confirm(`Yakin ingin menghapus kuis "${title}"?`)) return;

    setLoading(true);
    const result = await deleteQuiz(id);
    setLoading(false);

    if (result.success) {
      alert("Kuis berhasil dihapus!");
      if (reloadData) reloadData(); // Refresh UI Admin
    } else {
      alert(`Gagal menghapus kuis: ${result.message}`);
    }
  };

  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      {/* UI Admin Panel tetap menggunakan komponen yang ada */}
    </div>
  );
}
