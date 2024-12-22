document.addEventListener('DOMContentLoaded', () => {
    const chatForm = document.getElementById('chat-form');
    const messageInput = document.getElementById('message-input');
    const chatMessages = document.getElementById('chat-messages');
    let isWaitingForResponse = false;

    // Add initial greeting
    addBotMessage("Hello! I'm your healthcare assistant. How can I help you today?");

    chatForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        const message = messageInput.value.trim();
        if (!message || isWaitingForResponse) return;

        // Add user message
        addUserMessage(message);
        messageInput.value = '';

        // Show typing indicator
        isWaitingForResponse = true;
        const typingIndicator = showTypingIndicator();

        try {
            console.log('Sending request to chat function...');
            const response = await fetch('/.netlify/functions/chat', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Accept': 'application/json'
                },
                body: JSON.stringify({ message })
            });

            // Log the raw response
            const rawResponse = await response.text();
            console.log('Raw response:', rawResponse);

            // Try to parse as JSON
            let data;
            try {
                data = JSON.parse(rawResponse);
                console.log('Parsed JSON:', data);
            } catch (error) {
                console.error('Failed to parse response as JSON:', error);
                throw new Error('Server returned invalid JSON');
            }

            if (!response.ok) {
                console.error('API Error:', data);
                throw new Error(data.details || data.error || 'Failed to get response');
            }

            // Remove typing indicator and add bot message
            typingIndicator.remove();
            addBotMessage(data.response);
        } catch (error) {
            console.error('Error:', error);
            typingIndicator.remove();
            addErrorMessage(error.message || "I apologize, but I'm having trouble processing your request. Please try again");
        } finally {
            isWaitingForResponse = false;
            messageInput.focus();
        }
    });

    function addUserMessage(message) {
        const messageElement = document.createElement('div');
        messageElement.className = 'message user-message';
        messageElement.textContent = message;
        chatMessages.appendChild(messageElement);
        scrollToBottom();
    }

    function addBotMessage(message) {
        const messageElement = document.createElement('div');
        messageElement.className = 'message bot-message';
        
        // Format the message with line breaks
        const formattedMessage = message.split('\n').map(line => {
            if (line.trim() === '') return '';
            return `<p>${line}</p>`;
        }).join('');
        
        messageElement.innerHTML = formattedMessage;
        chatMessages.appendChild(messageElement);
        scrollToBottom();
    }

    function addErrorMessage(message) {
        const messageElement = document.createElement('div');
        messageElement.className = 'message bot-message error';
        messageElement.innerHTML = `<p><i class="fas fa-exclamation-circle"></i> ${message}</p>`;
        chatMessages.appendChild(messageElement);
        scrollToBottom();
    }

    function showTypingIndicator() {
        const typingIndicator = document.createElement('div');
        typingIndicator.className = 'typing-indicator';
        typingIndicator.innerHTML = `
            <span></span>
            <span></span>
            <span></span>
        `;
        chatMessages.appendChild(typingIndicator);
        scrollToBottom();
        return typingIndicator;
    }

    function scrollToBottom() {
        requestAnimationFrame(() => {
            chatMessages.scrollTop = chatMessages.scrollHeight;
        });
    }

    // Handle input focus and button states
    messageInput.addEventListener('input', () => {
        const submitButton = chatForm.querySelector('button[type="submit"]');
        submitButton.disabled = !messageInput.value.trim() || isWaitingForResponse;
    });

    // Add placeholder text rotation
    const placeholders = [
        "Type your health concern...",
        "How are you feeling today?",
        "What symptoms are you experiencing?",
        "Ask me about your health...",
        "I'm here to help with your health questions..."
    ];

    let currentPlaceholder = 0;
    setInterval(() => {
        currentPlaceholder = (currentPlaceholder + 1) % placeholders.length;
        messageInput.setAttribute('placeholder', placeholders[currentPlaceholder]);
    }, 3000);
});
