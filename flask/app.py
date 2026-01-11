from flask import Flask, jsonify
from datetime import datetime

app = Flask(__name__)

@app.route('/flask/')
def index():
    return jsonify({
        'message': 'Hello from Flask!',
        'timestamp': datetime.now().isoformat()
    })

@app.route('/flask/health')
def health():
    return jsonify({'status': 'ok', 'server': 'flask'})

@app.route('/flask/users')
def users():
    return jsonify([
        {'id': 1, 'name': '田中太郎'},
        {'id': 2, 'name': '山田花子'},
    ])

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5001, debug=True)
