# AI-Powered Coding IDE

A web-based intelligent development environment that integrates Monaco Editor with AI assistance for enhanced coding productivity.

## Features

- **Monaco Editor Integration**: Professional code editor with syntax highlighting, IntelliSense, and more
- **AI-Powered Assistance**: 
  - Code explanation
  - Debugging help
  - Code generation
  - Code optimization
  - Custom prompts
- **Multi-Language Support**: JavaScript, Python, Java, C++, HTML, CSS, JSON, SQL
- **Dark/Light Theme**: Toggle between themes with system preference detection
- **Responsive Design**: Works on desktop and mobile devices
- **Keyboard Shortcuts**: Quick access to AI features
- **Local Storage**: Saves API key and theme preferences

## Setup Instructions

1. **Get OpenAI API Key**:
   - Visit [OpenAI Platform](https://platform.openai.com/api-keys)
   - Create an account and generate an API key

2. **Run the IDE**:
   - Open `index.html` in a web browser
   - Enter your OpenAI API key when prompted
   - Start coding with AI assistance!

## Usage

### AI Actions
- **Explain**: Select code and click "Explain" or press `Ctrl+E`
- **Debug**: Select code and click "Debug" or press `Ctrl+Shift+D`
- **Generate**: Click "Generate" or press `Ctrl+G` and describe what you want
- **Optimize**: Select code and click "Optimize" or press `Ctrl+O`
- **Custom Prompt**: Enter a custom prompt and click "Send Custom Prompt"

### Keyboard Shortcuts
- `Ctrl+E`: Explain code
- `Ctrl+Shift+D`: Debug code
- `Ctrl+G`: Generate code
- `Ctrl+O`: Optimize code
- `Ctrl+Enter`: Send custom prompt
- `Ctrl+?`: Show help dialog

## File Structure

```
AI-Powered-IDE/
├── index.html          # Main HTML file
├── css/
│   └── style.css       # Styling and responsive design
├── js/
│   ├── editor.js       # Monaco Editor initialization
│   ├── aiService.js    # OpenAI API integration
│   ├── actions.js      # Button event handling
│   └── main.js         # App initialization and main logic
├── assets/
│   └── logo.png        # Application logo
└── README.md           # This file
```

## Configuration

The IDE uses OpenAI's GPT-3.5-turbo model by default. You can modify the AI settings in `js/aiService.js`:

- `model`: AI model to use
- `maxTokens`: Maximum response length
- `temperature`: Response creativity (0-1)
- `baseURL`: API endpoint

## Browser Compatibility

- Chrome 90+
- Firefox 88+
- Safari 14+
- Edge 90+

## Security Notes

- API keys are stored locally in your browser only
- No data is sent to third-party servers except OpenAI API
- Clear your browser data to remove stored API keys

## Future Enhancements

- File explorer panel
- Multi-file project support
- GitHub integration
- Real-time collaboration
- Code execution sandbox
- Additional AI providers
- Plugin system

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## License

MIT License - feel free to use this project for personal or commercial purposes.

## Support

For issues or questions:
1. Check the browser console for errors
2. Verify your OpenAI API key is valid
3. Ensure you have internet connectivity
4. Try refreshing the page

---

Built with ❤️ using Monaco Editor and OpenAI API
