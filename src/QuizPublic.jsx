import { getQuizById } from '../services/quizService';

async function loadPublicQuiz() {
  const urlParams = new URLSearchParams(window.location.search);
  const quizId = urlParams.get('id');

  if (!quizId) {
    showErrorState("ID Kuis tidak ditemukan di URL.");
    return;
  }

  const result = await getQuizById(quizId);

  if (result.success) {
    // Tampilkan data kuis buatan pengguna yang berhasil dimuat
    renderQuizUI(result.data);
  } else {
    // Tampilkan pesan bahwa kuis tidak ditemukan, JANGAN tampilkan kuis default
    showErrorState("Kuis tidak ditemukan atau belum dipublikasikan.");
  }
}
