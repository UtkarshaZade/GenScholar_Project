// frontend/js/formatter.js — Format Definitions & AI Prompt Templates

const FORMATS = {
  IEEE: {
    name: 'IEEE Conference & Journal',
    short: 'IEEE',
    tagClass: 'tag-ieee',
    citationStyle: 'Numeric [1]',
    abstractRange: [100, 250],
    columns: 2,
    font: 'Times New Roman 10pt',
    maxPages: 6,
    description: 'Two-column layout · Numeric citations [1] · 8.5×11" page · 10pt Times New Roman · Abstract ≤250 words · 6-page conference limit.',
    rules: ['≤250 word abstract', '2-column layout', 'Numeric refs [1]', '6-page limit', '10pt Times New Roman'],
    requiredSections: ['Abstract', 'Introduction', 'Related Work', 'Methodology', 'Results', 'Conclusion', 'References']
  },
  APA: {
    name: 'American Psychological Association',
    short: 'APA 7th',
    tagClass: 'tag-apa',
    citationStyle: 'Author-year (Smith, 2022)',
    abstractRange: [150, 250],
    columns: 1,
    font: 'Times New Roman 12pt',
    spacing: 'Double-spaced',
    description: 'Author-year citations (Smith, 2022) · Double-spaced · 12pt Times New Roman · 1" margins · Abstract 150–250 words · DOI required.',
    rules: ['Author-year citations', 'DOI required', '150–250 abstract', 'Double-spaced', 'Running head'],
    requiredSections: ['Abstract', 'Keywords', 'Introduction', 'Method', 'Results', 'Discussion', 'References']
  },
  Springer: {
    name: 'Springer Lecture Notes in Computer Science',
    short: 'Springer LNCS',
    tagClass: 'tag-springer',
    citationStyle: 'Numeric or Author-year',
    abstractRange: [50, 150],
    maxPages: 15,
    description: 'Single-column · Author-year or numeric citations · Abstract ≤150 words · Maximum 15 pages · LaTeX LNCS class required · Keywords mandatory.',
    rules: ['≤150 word abstract', '≤15 pages', 'Keywords required', 'LaTeX LNCS class', 'Single-column'],
    requiredSections: ['Abstract', 'Keywords', 'Introduction', 'Related Work', 'Approach', 'Evaluation', 'Conclusion', 'References']
  },
  ACM: {
    name: 'ACM SIGCHI / Digital Library',
    short: 'ACM',
    tagClass: 'tag-acm',
    citationStyle: 'Numeric',
    abstractRange: [150, 200],
    columns: 2,
    description: 'Two-column SIGCHI format · Numeric citations · Abstract 150–200 words · CCS Concepts required · ACM rights block in footer.',
    rules: ['CCS Concepts required', '150–200 abstract', '2-column SIGCHI', 'Numeric citations', 'ACM rights block'],
    requiredSections: ['Abstract', 'CCS Concepts', 'Keywords', 'Introduction', 'Related Work', 'System', 'Evaluation', 'Conclusion', 'References']
  },
  Scopus: {
    name: 'Scopus Indexed Journals',
    short: 'Scopus',
    tagClass: 'tag-scopus',
    citationStyle: 'Varies by journal',
    abstractRange: [150, 300],
    abstractType: 'Structured',
    description: 'Structured abstract (Background/Methods/Results/Conclusion) · DOI mandatory · ORCID recommended · Conflict of interest statement required.',
    rules: ['Structured abstract', 'DOI mandatory', 'ORCID recommended', 'COI statement', 'Funding statement'],
    requiredSections: ['Structured Abstract', 'Keywords', 'Introduction', 'Materials & Methods', 'Results', 'Discussion', 'Conclusion', 'References']
  },
  Elsevier: {
    name: 'Elsevier Journals',
    short: 'Elsevier',
    tagClass: 'tag-elsevier',
    citationStyle: 'Harvard author-year',
    abstractRange: [150, 250],
    columns: 1,
    description: 'Single-column submission · Harvard-style author-year citations · Highlights section (3–5 bullet points ≤125 chars each) · Graphical abstract recommended.',
    rules: ['Highlights (3–5 bullets)', 'Harvard citations', '150–250 abstract', '≤125 chars/highlight', 'Graphical abstract'],
    requiredSections: ['Highlights', 'Abstract', 'Keywords', 'Introduction', 'Materials & Methods', 'Results', 'Discussion', 'Conclusion', 'References']
  }
};

// ── AI Prompt Templates ──
const PROMPTS = {

  formatSystem: (format) => `You are GenScholar, an expert academic paper formatting and compliance assistant with deep knowledge of all major publication standards. Your job is to:
1. Reformat the given research paper draft according to the specified journal/conference standard
2. Produce a properly structured output with correct section headers and citation style
3. Add required metadata sections (CCS Concepts, Highlights, Keywords, Structured Abstract sections, etc.) based on the format
4. Identify all compliance issues with specificity and actionable detail

You must respond ONLY with valid JSON — no markdown fences, no preamble, no extra text.

JSON structure:
{
  "formatted": "The complete reformatted paper text. Use proper sections with correct headings, citations in the right style, required metadata. Make it look like a real academic draft ready for submission.",
  "issues": [
    { "level": "error", "category": "Citation Format", "message": "Specific actionable description of what violates the standard" },
    { "level": "warning", "category": "Abstract", "message": "Specific warning with what to fix" },
    { "level": "ok", "category": "Structure", "message": "What is already compliant" }
  ],
  "metrics": {
    "wordCount": 0,
    "estimatedPages": 0.0,
    "abstractWords": 0,
    "referenceCount": 0,
    "readabilityScore": 0,
    "readabilityGrade": "Graduate level",
    "complianceScore": 0
  },
  "abstractAnalysis": {
    "summary": "One-paragraph evaluation of abstract quality and completeness for submission",
    "sections": [
      { "name": "Background/Motivation", "found": true, "note": "Brief specific note" },
      { "name": "Objective/Problem Statement", "found": true, "note": "Brief specific note" },
      { "name": "Methodology", "found": false, "note": "Brief specific note" },
      { "name": "Results/Findings", "found": true, "note": "Brief specific note" },
      { "name": "Conclusion/Impact", "found": false, "note": "Brief specific note" }
    ]
  },
  "citations": [
    { "text": "First author + title snippet (max 75 chars)", "status": "valid", "note": "Correctly formatted for ${format}" },
    { "text": "Short snippet", "status": "issue", "note": "Specific problem description" },
    { "text": "Short snippet", "status": "check", "note": "What to verify" }
  ]
}

Rules:
- "level" must be exactly: "error", "warning", or "ok"
- "status" must be exactly: "valid", "issue", or "check"  
- complianceScore: integer 0–100 (100 = perfectly compliant)
- Include 5–9 issues covering different categories
- Include all real citations found, max 8 shown
- readabilityScore: Flesch-Kincaid 0–100`,

  abstractSystem: (format) => `You are an expert at evaluating academic paper abstracts for ${format} publication standards. Respond ONLY with valid JSON:
{
  "summary": "Detailed evaluation paragraph of the abstract quality, clarity, completeness, and suitability for ${format} submission",
  "wordCount": 0,
  "targetMin": 150,
  "targetMax": 250,
  "sections": [
    { "name": "Background/Motivation", "found": true, "note": "Specific observation about this element" },
    { "name": "Objective/Problem Statement", "found": true, "note": "Specific observation" },
    { "name": "Methodology", "found": false, "note": "What is missing" },
    { "name": "Results/Findings", "found": true, "note": "Specific observation" },
    { "name": "Conclusion/Impact", "found": false, "note": "What to add" }
  ],
  "suggestions": [
    "Specific actionable suggestion 1",
    "Specific actionable suggestion 2",
    "Specific actionable suggestion 3"
  ]
}`,

  citationsSystem: (format) => `You are an expert at checking academic citations for ${format} format compliance. Extract and evaluate all references found in the paper.
Respond ONLY with a valid JSON array (no wrapper object):
[
  { "text": "Author(s) + abbreviated title (max 75 chars)", "status": "valid", "note": "Correctly formatted per ${format} style" },
  { "text": "Short snippet", "status": "issue", "note": "Specific problem: missing DOI / wrong author format / year placement / etc." },
  { "text": "Short snippet", "status": "check", "note": "Specific thing the author should verify" }
]
Status values: exactly "valid", "issue", or "check". No other values.
Extract all real citations found. If none found, return empty array [].`
};

// ── Sample Papers ──
const SAMPLES = {
  ml: {
    title: 'Deep Learning for Diabetic Retinopathy Detection',
    field: 'Computer Vision / Healthcare AI',
    content: `Title: Deep Learning-Based Early Detection of Diabetic Retinopathy Using Fundus Photography

Abstract:
Diabetic retinopathy (DR) is a leading cause of preventable blindness worldwide. Early detection is critical for effective treatment, yet traditional screening requires specialist expertise. This paper presents a convolutional neural network (CNN) approach for automated DR detection from fundus photographs, achieving 94.2% sensitivity and 91.8% specificity on the EyePACS dataset. Our model uses transfer learning from ResNet-50, fine-tuned on 80,000 labeled retinal images. Results demonstrate that AI-assisted screening can significantly reduce diagnostic delay in underserved regions.

Introduction:
Diabetes mellitus affects approximately 422 million people globally. Diabetic retinopathy is the most common microvascular complication, affecting up to 80% of patients with 20+ years of diabetes. Current screening relies on ophthalmologists examining fundus images—bottlenecked by specialist availability. Deep learning advances show strong promise for medical image classification.

Methodology:
We implemented ResNet-50 pre-trained on ImageNet and fine-tuned on the EyePACS fundus dataset. Images were preprocessed using CLAHE normalization and random augmentation (rotation, flipping, brightness). The model trained for 50 epochs with Adam optimizer (lr=0.0001), batch size 32, on 4× NVIDIA V100 GPUs. 5-fold cross-validation was used for evaluation.

Results:
Our model achieved AUC 0.97, sensitivity 94.2%, specificity 91.8%, accuracy 93.1%. Compared to baselines: AlexNet (88.3% acc), VGG-16 (90.7% acc). ResNet-50 with transfer learning outperformed both significantly.

Conclusion:
The proposed system demonstrates strong performance for automated DR screening and could assist ophthalmologists in high-volume settings. Future work will explore EHR integration and mobile deployment.

References:
Gulshan V et al. 2016. Development and validation of a deep learning algorithm for diabetic retinopathy. JAMA. 316(22):2402-2410.
He K et al. 2016. Deep residual learning for image recognition. CVPR 2016. pp 770-778.
WHO. 2023. Global report on diabetes. World Health Organization, Geneva.
Abramoff M et al. 2018. Pivotal trial of an autonomous AI-based diagnostic system for diabetic retinopathy. NPJ Digital Medicine. 1:39.`
  },
  nlp: {
    title: 'Transformer-Based Sentiment Analysis for Code-Switching Text',
    field: 'Natural Language Processing',
    content: `Title: Multilingual Sentiment Analysis of Code-Switching Social Media Text Using Fine-Tuned Transformers

Abstract:
Code-switching—the practice of alternating between multiple languages in a single utterance—poses significant challenges for standard NLP pipelines. We present a fine-tuned mBERT model for sentiment analysis on Hinglish (Hindi-English) social media text. Trained on 45,000 annotated tweets, our approach achieves 87.3% F1 on a held-out test set, outperforming monolingual baselines by 14%. We also release a new benchmark dataset of 10,000 manually annotated Hinglish tweets.

Introduction:
Social media platforms host massive volumes of multilingual content. In India alone, over 600 million internet users produce content mixing Hindi and English. Existing sentiment tools perform poorly on such data, trained primarily on monolingual corpora. This work addresses the gap with transformer-based models trained specifically on code-switched text.

Related Work:
Prior work on code-switching includes Solorio and Liu 2008 who analyzed syntactic patterns. Barman et al 2014 introduced token-level language identification. Recent transformer models like mBERT Devlin et al 2019 and XLM-R Conneau et al 2020 show multilingual capabilities but lack code-switching specific fine-tuning.

Methodology:
We collected 45,000 tweets using Twitter API filtered by Hinglish hashtags. Tweets were manually annotated for sentiment (positive/negative/neutral) by three annotators (Cohen κ=0.76). We fine-tuned mBERT on 36,000 training samples, validated on 4,500, and tested on 4,500.

Results:
mBERT fine-tuned achieved F1=87.3%, Accuracy=88.1%. Compared to VADER (F1=61.2%), TextBlob (F1=59.8%), monolingual BERT (F1=73.4%). Our model shows consistent gains across all sentiment classes.

Conclusion:
Fine-tuned multilingual transformers significantly outperform baselines for code-switching sentiment. Future work will extend to other language pairs (Tamil-English, Bengali-English).

References:
Devlin J et al. 2019. BERT: Pre-training of deep bidirectional transformers. NAACL-HLT 2019.
Conneau A et al. 2020. Unsupervised cross-lingual representation learning. ACL 2020.
Barman U et al. 2014. Code mixing: A challenge for language identification. EMNLP 2014.
Solorio T, Liu Y. 2008. Learning to predict code-switching points. EMNLP 2008.`
  },
  iot: {
    title: 'IoT-Based Smart Agriculture System',
    field: 'Internet of Things / Agriculture',
    content: `Title: Precision Agriculture Using IoT Sensor Networks and Federated Learning for Crop Yield Prediction

Abstract:
Modern agriculture faces challenges of resource inefficiency and yield uncertainty. We present an IoT-based precision agriculture system that integrates soil moisture, temperature, pH, and humidity sensors with a federated learning model for crop yield prediction. Deployed across 12 farms over 8 months, our system reduced water consumption by 31% and improved yield prediction accuracy to 89.4% compared to traditional regression models (72.1%). Federated learning ensures farmer data privacy while enabling model improvement across the network.

Introduction:
Global food demand is projected to increase 70% by 2050, while arable land and water resources shrink. Traditional farming relies on intuition rather than data-driven decisions. IoT sensor networks can collect real-time field data, while machine learning enables predictive decision-making. However, centralized data collection raises privacy concerns for smallholder farmers.

System Architecture:
Our system comprises three tiers. Edge tier: Arduino Mega nodes with SHT31 temperature/humidity, capacitive soil moisture, and Atlas pH sensors communicating via LoRa (915 MHz). Fog tier: Raspberry Pi 4 aggregators perform local preprocessing and run federated learning local updates. Cloud tier: aggregates global model updates and provides a farmer dashboard.

Methodology:
12 farms in Maharashtra participated from June–January 2024. Sensors sampled every 15 minutes. Federated learning used FedAvg algorithm with 10 local epochs before aggregation. Crop yield model: 4-layer LSTM with attention mechanism. Irrigation control: rule-based system + RL agent (Q-learning).

Results:
Water usage reduced 31% vs control farms. Yield prediction: FL model RMSE=0.34 t/ha, baseline regression RMSE=0.81 t/ha. System uptime: 97.2% over 8 months. Farmer satisfaction score: 4.3/5.

References:
McMahan B et al. 2017. Communication-efficient learning of deep networks from decentralized data. AISTATS 2017.
Li T et al. 2020. Federated learning challenges, methods, applications. IEEE Signal Processing. 37(3):50-60.
Kamilaris A, Prenafeta-Boldu FX. 2018. Deep learning in agriculture: A survey. Computers Electronics Agriculture. 147:70-90.`
  }
};

window.FORMATS = FORMATS;
window.PROMPTS = PROMPTS;
window.SAMPLES = SAMPLES;
