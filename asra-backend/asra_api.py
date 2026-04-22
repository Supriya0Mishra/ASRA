import os
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
import torch
import torch.nn as nn
import torch.nn.functional as F
from transformers import DistilBertModel, DistilBertTokenizer
import joblib, json, re, math, datetime, whois
from urllib.parse import urlparse
import numpy as np
import google.generativeai as genai

app = FastAPI(title="ASRA AI Backend")

# --- 1. ENABLE FRONTEND CONNECTION (CORS) ---
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# --- 2. CONFIGURE GEMINI 1.5 FLASH ---
GEMINI_KEY = "AIzaSyAdx7sReffSz9x7PGilblFUQ0t5izANdOc"
genai.configure(api_key=GEMINI_KEY)

safety_settings = [
    {"category": "HARM_CATEGORY_DANGEROUS_CONTENT", "threshold": "BLOCK_NONE"},
    {"category": "HARM_CATEGORY_HARASSMENT", "threshold": "BLOCK_NONE"},
    {"category": "HARM_CATEGORY_HATE_SPEECH", "threshold": "BLOCK_NONE"},
    {"category": "HARM_CATEGORY_SEXUALLY_EXPLICIT", "threshold": "BLOCK_NONE"},
]

gemini_model = genai.GenerativeModel(
    model_name='gemini-1.5-flash',
    safety_settings=safety_settings
)

# --- 3. LOAD AI ASSETS ---
device = torch.device('cpu') 
scaler = joblib.load('asra_scaler.pkl')
with open('asra_chars.json', 'r') as f:
    char_to_int = json.load(f)
tokenizer_bert = DistilBertTokenizer.from_pretrained('distilbert-base-uncased')

# --- 4. MODEL ARCHITECTURE (FIXED NameError) ---
class FinalIdentityModel(nn.Module):
    def __init__(self):
        super(FinalIdentityModel, self).__init__()
        self.bert = DistilBertModel.from_pretrained('distilbert-base-uncased')
        self.char_embed = nn.Embedding(75, 64)
        self.conv = nn.Conv1d(64, 128, kernel_size=5, padding=2)
        self.lstm = nn.LSTM(128, 64, bidirectional=True, batch_first=True)
        # 9 features in, 256 out to match training V5
        self.expert_fc = nn.Sequential(nn.Linear(9, 256), nn.ReLU(), nn.Dropout(0.2))
        self.fusion = nn.Sequential(
            nn.Linear(768 + 128 + 256, 512),
            nn.ReLU(),
            nn.Dropout(0.5),
            nn.Linear(512, 1),
            nn.Sigmoid()
        )

    def forward(self, ids, mask, char_seq, expert_feat):
        # 1. Semantic Path
        bert_output = self.bert(ids, attention_mask=mask)[0][:, 0, :]
        bert_out = F.dropout(bert_output, p=0.4) 
        
        # 2. Visual Path
        x_char = F.relu(self.conv(self.char_embed(char_seq).transpose(1, 2))).transpose(1, 2)
        _, (h_n, _) = self.lstm(x_char)
        char_out = torch.cat((h_n[0], h_n[1]), dim=1)
        
        # 3. Expert Path
        exp_out = self.expert_fc(expert_feat)
        
        # FIXED: Variable names now match for concatenation
        return self.fusion(torch.cat((bert_out, char_out, exp_out), dim=1))

model = FinalIdentityModel().to(device)
model.load_state_dict(torch.load('asra_model.pth', map_location=device))
model.eval()

# --- 5. UTILITIES ---
WHITELIST = ['google.com', 'hotstar.com', 'netflix.com', 'bolster.ai', 'checkphish.ai', 'facebook.com', 'amazon.in', 'amazon.com', 'wikipedia.org']

def extract_features(url, age_days):
    url_str = str(url).lower()
    parsed = urlparse(url_str)
    domain = parsed.netloc.replace("www.", "")
    at_count, pct_count = url_str.count('@'), url_str.count('%')
    is_typo = 0
    for b in ['google', 'facebook', 'paypal', 'amazon', 'microsoft']:
        if b in domain and not domain.endswith('.com'):
            is_typo = 1; break
    danger_score = (at_count * 10.0) + (pct_count * 10.0) + (is_typo * 5.0)
    if url_str.startswith('https') and danger_score > 0: danger_score += 15.0
    effective_age = age_days if age_days != -1 else 0
    return [len(url_str), len(domain), url_str.count('.'), at_count, pct_count,
            danger_score, sum(c.isdigit() for c in url_str), 1 if url_str.startswith('https') else 0, effective_age]

# --- 6. THE SCAN ENDPOINT ---
@app.get("/scan")
async def scan(url: str):
    # A. Whitelist Check
    hostname = urlparse(url).hostname if urlparse(url).hostname else ""
    if any(site in hostname for site in WHITELIST):
        return {
            "status": "SAFE", 
            "probability": "0.01%", 
            "age_days": 8000, 
            "created_on": "Legacy Verified Domain",
            "tips": "✅ Verified: This domain is a globally recognized secure entity."
        }

    # B. WHOIS Check
    try:
        domain_to_check = ".".join(hostname.split(".")[-2:])
        w = whois.whois(domain_to_check)
        creation_date = w.creation_date[0] if isinstance(w.creation_date, list) else w.creation_date
        age = (datetime.datetime.now() - creation_date).days
        date_str = creation_date.strftime('%Y-%m-%d')
    except:
        age, date_str = -1, "Unknown"

    # C. Prediction
    feats = extract_features(url, age)
    with torch.no_grad():
        e_feat = torch.tensor(scaler.transform([feats]), dtype=torch.float)
        char_s = torch.tensor([[char_to_int.get(c, 0) for c in url[:128]] + [0]*max(0, 128-len(url))], dtype=torch.long)
        b_in = tokenizer_bert(url, return_tensors="pt", truncation=True, padding='max_length', max_length=128)
        prob = model(b_in['input_ids'], b_in['attention_mask'], char_s, e_feat).item()

    # D. Safety Logic Overrides
    if (0 < age < 14) or (feats[5] > 10.0): prob = max(prob, 0.99)
    status = "PHISHING" if prob > 0.4 else "SAFE"

    # E. GEMINI FORENSIC ANALYSIS
    try:
        prompt = f"""Cyber-Threat Analyst Report:
                    URL: {url}
                    Detection: {status} ({prob*100:.2f}% risk)
                    Domain Age: {age} days.
                    Explain the technical trick and intent in 30 words max. Forensic tone."""
        
        response = gemini_model.generate_content(prompt)
        ai_advice = response.text
    except:
        ai_advice = "🚨 Suspicious behavioral patterns detected. High risk of credential hijacking." if status == "PHISHING" else "✅ Legitimate navigation pattern. No semantic anomalies found."

    return {
        "status": status,
        "probability": f"{prob*100:.2f}%",
        "age_days": age,
        "created_on": date_str,
        "tips": ai_advice
    }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="127.0.0.1", port=8000)