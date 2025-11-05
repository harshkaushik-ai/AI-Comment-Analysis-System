import sys
import json
from transformers import AutoTokenizer, AutoModelForSequenceClassification
import torch


tokenizer = AutoTokenizer.from_pretrained("unitary/toxic-bert")
model = AutoModelForSequenceClassification.from_pretrained("unitary/toxic-bert")


input_text = sys.stdin.read()
data = json.loads(input_text)
comments = data.get("comments", [])

scores = []

for comment in comments:
    
    if not comment or not isinstance(comment, str):
        comment = ""
    
    
    try:
        inputs = tokenizer(comment, return_tensors="pt", truncation=True)
        with torch.no_grad():
            outputs = model(**inputs)
            logits = outputs.logits
            prob = torch.sigmoid(logits)[0][0].item()
            scores.append(prob)
    except Exception as e:
        print(f"Error tokenizing comment: {comment} -> {e}", file=sys.stderr)
        scores.append(0.0)  

avg_toxicity = sum(scores) / len(scores) if scores else 0.0


print(json.dumps({
    "scores": scores,
    "avgToxicity": avg_toxicity
}))









# import sys
# import json
# import os
# from transformers import pipeline

# # Load API key from environment (not required for free models)
# hf_key = os.getenv("HF_API_KEY")

# # Load Hugging Face toxicity model
# classifier = pipeline(
#     "text-classification",
#     model="unitary/toxic-bert"
# )

# # Read comments from Node stdin
# input_text = sys.stdin.read().strip()
# comments = json.loads(input_text)

# results = []
# scores = []

# for comment in comments:
#     try:
#         preds = classifier(comment)
#         label = preds[0]["label"]
#         score = preds[0]["score"]
#         toxic = 1 if label.lower() == "toxic" else 0
#         results.append({
#             "text": comment,
#             "label": label,
#             "score": score
#         })
#         scores.append(score if toxic else 0)
#     except Exception as e:
#         results.append({"text": comment, "error": str(e)})

# avg_toxicity = sum(scores) / len(scores) if scores else 0

# output = {
#     "comments": results,
#     "avgToxicity": avg_toxicity
# }

# print(json.dumps(output))
# sys.stdout.flush()
