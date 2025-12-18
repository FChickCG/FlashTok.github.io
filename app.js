import { initializeApp } from "www.gstatic.com";
import { getAuth, createUserWithEmailAndPassword, signInWithEmailAndPassword, onAuthStateChanged } from "www.gstatic.com";
import { getFirestore, collection, addDoc, query, orderBy, onSnapshot, serverTimestamp } from "www.gstatic.com";
import { getStorage, ref, uploadBytes, getDownloadURL } from "www.gstatic.com";

const firebaseConfig = {
    apiKey: "AIzaSyCWjK6_cDqpcK9ZsFChNlxQFFyNoNZfeI4",
    authDomain: "flashtok-6ca2e.firebaseapp.com",
    projectId: "flashtok-6ca2e",
    storageBucket: "flashtok-6ca2e.firebasestorage.app",
    messagingSenderId: ""154014668428",
    appId: "1:154014668428:web:9bb562e817d8a94ca0cda9"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);
const storage = getStorage(app);

// --- Авторизация ---
document.getElementById('btn-signup').onclick = () => {
    const email = document.getElementById('email').value;
    const pass = document.getElementById('password').value;
    createUserWithEmailAndPassword(auth, email, pass).catch(alert);
};

document.getElementById('btn-login').onclick = () => {
    const email = document.getElementById('email').value;
    const pass = document.getElementById('password').value;
    signInWithEmailAndPassword(auth, email, pass).catch(alert);
};

onAuthStateChanged(auth, (user) => {
    if (user) {
        document.getElementById('auth-screen').classList.add('hidden');
        document.getElementById('main-screen').classList.remove('hidden');
        loadFeed();
        loadChat();
    }
});

// --- Загрузка контента ---
const fileInput = document.getElementById('file-input');
fileInput.onchange = (e) => {
    document.getElementById('edit-menu').classList.remove('hidden');
};

document.getElementById('btn-publish').onclick = async () => {
    const file = fileInput.files[0];
    const title = document.getElementById('post-title').value;
    
    // 1. Загрузка файла в Storage
    const storageRef = ref(storage, `uploads/${Date.now()}_${file.name}`);
    const snapshot = await uploadBytes(storageRef, file);
    const url = await getDownloadURL(snapshot.ref);

    // 2. Сохранение данных в Firestore
    await addDoc(collection(db, "posts"), {
        url,
        type: file.type.includes('video') ? 'video' : 'image',
        title,
        desc: document.getElementById('post-desc').value,
        tags: document.getElementById('post-tags').value,
        userId: auth.currentUser.uid,
        createdAt: serverTimestamp()
    });
    
    alert("Опубликовано!");
    showScreen('feed');
};

// --- Лента (TikTok Style) ---
function loadFeed() {
    const q = query(collection(db, "posts"), orderBy("createdAt", "desc"));
    onSnapshot(q, (snapshot) => {
        const container = document.getElementById('feed-container');
        container.innerHTML = '';
        snapshot.forEach(doc => {
            const data = doc.data();
            const postHtml = `
                <div class="video-card">
                    ${data.type === 'video' 
                        ? `<video src="${data.url}" loop autoplay muted></video>` 
                        : `<img src="${data.url}">`}
                    <div class="post-info">
                        <p>@user</p>
                        <p>${data.desc} ${data.tags}</p>
                    </div>
                </div>`;
            container.innerHTML += postHtml;
        });
    });
}

// --- Чат (Telegram Style) ---
document.getElementById('btn-send').onclick = async () => {
    const text = document.getElementById('chat-input').value;
    if(!text) return;
    await addDoc(collection(db, "messages"), {
        text,
        user: auth.currentUser.email,
        createdAt: serverTimestamp()
    });
    document.getElementById('chat-input').value = '';
};

function loadChat() {
    const q = query(collection(db, "messages"), orderBy("createdAt", "asc"));
    onSnapshot(q, (snapshot) => {
        const chatBox = document.getElementById('chat-messages');
        chatBox.innerHTML = '';
        snapshot.forEach(doc => {
            const m = doc.data();
            chatBox.innerHTML += `<div class="msg"><b>${m.user}:</b> ${m.text}</div>`;
        });
        chatBox.scrollTop = chatBox.scrollHeight;
    });
}

// Навигация
window.showScreen = (screen) => {
    document.querySelectorAll('.screen').forEach(s => s.classList.add('hidden'));
    if(screen === 'feed') document.getElementById('main-screen').classList.remove('hidden');
    if(screen === 'upload') document.getElementById('upload-screen').classList.remove('hidden');
    if(screen === 'chat') document.getElementById('chat-screen').classList.remove('hidden');
};
