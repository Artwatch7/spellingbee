// 全局变量
let wordLists = [];
let reviewWords = [];
let currentWord = '';
let currentIndex = 0;
let score = 0;
let synth = window.speechSynthesis;
let timer = null;
let isShuffled = false;
let selectedWordListIndex = 0;
const correctSound = document.getElementById('correctSound');
const incorrectSound = document.getElementById('incorrectSound');
const customSound = document.getElementById('customSound');

// DOM 元素
const wordFile = document.getElementById('wordFile');
const loadBtn = document.getElementById('loadBtn');
const startBtn = document.getElementById('startBtn');
const gameContainer = document.getElementById('gameContainer');
const wordDisplay = document.getElementById('wordDisplay');
const revealBtn = document.getElementById('revealBtn');
const userInput = document.getElementById('userInput');
const checkBtn = document.getElementById('checkBtn');
const nextBtn = document.getElementById('nextBtn');
const repeatBtn = document.getElementById('repeatBtn');
const resultDisplay = document.getElementById('result');
const scoreDisplay = document.getElementById('score');
const totalDisplay = document.getElementById('total');
const reviewList = document.getElementById('reviewList');
const reviewBtn = document.getElementById('reviewBtn');
const tabs = document.querySelectorAll('.tab');
const tabContents = document.querySelectorAll('.tab-content');
const instructionsBtn = document.getElementById('instructionsBtn');
const instructions = document.getElementById('instructions');
const fileInput = document.getElementById('fileInput');
const shuffleBtn = document.getElementById('shuffleBtn');
const wordlistSelect = document.getElementById('wordlistSelect');
const clearWordListsBtn = document.getElementById('clearWordListsBtn');

// 尝试从 localStorage 中获取保存的词表
const savedWordLists = localStorage.getItem('wordLists');
if (savedWordLists) {
    wordLists = JSON.parse(savedWordLists);
    updateWordlistSelect();
}

// 尝试从 localStorage 中获取保存的复习词库
const savedReviewWords = localStorage.getItem('reviewWords');
if (savedReviewWords) {
    reviewWords = JSON.parse(savedReviewWords);
    updateReviewList();
}

// 标签页切换
tabs.forEach(tab => {
    tab.addEventListener('click', () => {
        tabs.forEach(t => t.classList.remove('active'));
        tabContents.forEach(c => c.classList.remove('active'));
        tab.classList.add('active');
        document.getElementById(tab.dataset.tab + 'Tab').classList.add('active');

        if (tab.dataset.tab === 'review' && reviewWords.length === 0) {
            document.getElementById('reviewTab').classList.add('review-empty-state');
        }
    });
});

// 加载词表
loadBtn.addEventListener('click', () => {
    const file = wordFile.files[0];
    if (!file) {
        alert('请先选择词表文件');
        return;
    }
    const reader = new FileReader();
    reader.onload = function (e) {
        const content = e.target.result;
        const newWordList = content.split('\n').map(word => word.trim()).filter(word => word.length > 0);
        if (wordLists.length >= 3) {
            alert('最多只能保存三个词表，请删除一个后再导入。');
            return;
        }
        wordLists.push(newWordList);
        localStorage.setItem('wordLists', JSON.stringify(wordLists));
        updateWordlistSelect();
        alert(`成功导入词表，共 ${newWordList.length} 个单词`);
    };
    reader.readAsText(file);
});

// 更新词表选择下拉框
function updateWordlistSelect() {
    wordlistSelect.innerHTML = '';
    wordLists.forEach((_, index) => {
        const option = document.createElement('option');
        option.value = index;
        option.textContent = `词表 ${index + 1}`;
        wordlistSelect.appendChild(option);
    });
}

// 选择词表
wordlistSelect.addEventListener('change', () => {
    selectedWordListIndex = parseInt(wordlistSelect.value);
});

// 开始游戏
startBtn.addEventListener('click', () => {
    if (wordLists.length === 0) {
        alert('请先导入词表');
        return;
    }
    const selectedWordList = wordLists[selectedWordListIndex];
    currentIndex = 0;
    score = 0;
    scoreDisplay.textContent = score;
    totalDisplay.textContent = 0;
    showNextWord(selectedWordList);
    fileInput.style.display = 'none';
});

// 开始复习
reviewBtn.addEventListener('click', () => {
    if (reviewWords.length === 0) {
        alert('复习词库中没有单词');
        return;
    }
    const selectedWordList = reviewWords;
    reviewWords = [];
    updateReviewList();
    currentIndex = 0;
    score = 0;
    scoreDisplay.textContent = score;
    totalDisplay.textContent = 0;
    showNextWord(selectedWordList);
    document.querySelector('.tab[data-tab="game"]').click();
    localStorage.removeItem('reviewWords');
    document.getElementById('reviewTab').classList.remove('review-empty-state');
});

// 显示下一个单词
function showNextWord(wordList) {
    if (timer) {
        clearTimeout(timer);
        timer = null;
    }
    if (currentIndex >= wordList.length) {
        wordDisplay.textContent = '游戏结束!';
        wordDisplay.classList.remove('hidden');
        userInput.style.display = 'none';
        checkBtn.style.display = 'none';
        nextBtn.style.display = 'none';
        revealBtn.style.display = 'none';
        repeatBtn.style.display = 'none';
        resultDisplay.textContent = `最终得分: ${score} / ${currentIndex}`;
        if (reviewWords.length > 0) {
            reviewBtn.style.display = 'inline-block';
        }
        return;
    }
    currentWord = wordList[currentIndex];
    wordDisplay.textContent = currentWord;
    wordDisplay.classList.add('hidden');
    userInput.value = '';
    resultDisplay.textContent = '';
    userInput.focus();
    speakWord(currentWord);
}

// 朗读单词
function speakWord(word) {
    const audioUrl = `https://dict.youdao.com/dictvoice?type=0&audio=${word}`;
    customSound.src = audioUrl;
    customSound.play().catch(error => {
        console.error(`播放单词 "${word}" 的音频失败:`, error);
        alert(`抱歉，无法播放单词 "${word}" 的发音。`);
    });
}

// 检查拼写
function checkSpelling() {
    const userAnswer = userInput.value.trim().toLowerCase();
    const correctAnswer = currentWord.toLowerCase();
    wordDisplay.classList.remove('hidden');
    if (userAnswer === correctAnswer) {
        resultDisplay.textContent = '正确!';
        resultDisplay.className = 'correct';
        score++;
        correctSound.play();
    } else {
        resultDisplay.textContent = `错误! 正确拼写是: ${currentWord}`;
        resultDisplay.className = 'incorrect';
        incorrectSound.play();
        if (!reviewWords.includes(currentWord)) {
            reviewWords.push(currentWord);
            updateReviewList();
            localStorage.setItem('reviewWords', JSON.stringify(reviewWords));
        }
    }
    scoreDisplay.textContent = score;
    totalDisplay.textContent = currentIndex + 1;
    wordDisplay.style.color = 'green';
    timer = setTimeout(() => {
        wordDisplay.style.color = '#333';
        currentIndex++;
        const selectedWordList = wordLists[selectedWordListIndex];
        showNextWord(selectedWordList);
    }, 2000);
}

// 更新复习错词显示
function updateReviewList() {
    if (reviewWords.length === 0) {
        reviewList.innerHTML = '<p>暂无需要复习的单词</p>';
        reviewBtn.style.display = 'none';
    } else {
        reviewList.innerHTML = reviewWords.map(word => `<div>${word}</div>`).join('');
        reviewBtn.style.display = 'inline-block';
    }
}

// 显示单词
revealBtn.addEventListener('click', () => {
    wordDisplay.classList.remove('hidden');
    wordDisplay.style.color = 'green';
});

// 事件监听
checkBtn.addEventListener('click', checkSpelling);
nextBtn.addEventListener('click', () => {
    wordDisplay.style.color = '#333';
    currentIndex++;
    const selectedWordList = wordLists[selectedWordListIndex];
    showNextWord(selectedWordList);
});
repeatBtn.addEventListener('click', () => speakWord(currentWord));
userInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') {
        checkSpelling();
    }
});

// 显示游戏说明
instructionsBtn.addEventListener('click', () => {
    if (instructions.style.display === 'none') {
        instructions.style.display = 'block';
    } else {
        instructions.style.display = 'none';
    }
});

// 乱序单词
shuffleBtn.addEventListener('click', () => {
    const selectedWordList = wordLists[selectedWordListIndex];
    if (selectedWordList.length > 0) {
        wordLists[selectedWordListIndex] = shuffleArray(selectedWordList);
        localStorage.setItem('wordLists', JSON.stringify(wordLists));
        currentIndex = 0;
        score = 0;
        scoreDisplay.textContent = score;
        totalDisplay.textContent = 0;
        showNextWord(selectedWordList);
        isShuffled = !isShuffled;
        if (isShuffled) {
            shuffleBtn.classList.add('shuffled');
        } else {
            shuffleBtn.classList.remove('shuffled');
        }
    } else {
        alert('请先导入词表');
    }
});

// 洗牌算法
function shuffleArray(array) {
    for (let i = array.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [array[i], array[j]] = [array[j], array[i]];
    }
    return array;
}

// 快捷键唤出导入词表功能
document.addEventListener('keydown', (e) => {
    if (e.ctrlKey && e.key === 'l') {
        if (fileInput.style.display === 'none') {
            fileInput.style.display = 'block';
        } else {
            fileInput.style.display = 'none';
        }
    }
});

// 清空词表
clearWordListsBtn.addEventListener('click', () => {
    if (confirm('确定要清空所有词表吗？')) {
        wordLists = [];
        localStorage.removeItem('wordLists');
        updateWordlistSelect();
        alert('词表已清空');
    }
});