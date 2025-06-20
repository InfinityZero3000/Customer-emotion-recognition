from transformers import Trainer, TrainingArguments, AutoModelForSequenceClassification, AutoTokenizer
from datasets import load_dataset

def train():
    model_name = "distilbert-base-uncased"
    num_labels = 2  # Sửa lại nếu là multi-class emotion

    # 1. Chuẩn bị dataset (ví dụ: SST2, hoặc dataset cảm xúc tiếng Việt)
    dataset = load_dataset("glue", "sst2")

    # 2. Tokenizer & Model
    tokenizer = AutoTokenizer.from_pretrained(model_name)
    model = AutoModelForSequenceClassification.from_pretrained(model_name, num_labels=num_labels)

    def preprocess(examples):
        return tokenizer(examples["sentence"], truncation=True, padding="max_length", max_length=128)

    tokenized = dataset.map(preprocess, batched=True)

    # 3. TrainingArguments & Trainer
    args = TrainingArguments(
        output_dir="./results",
        evaluation_strategy="epoch",
        per_device_train_batch_size=8,
        num_train_epochs=1,
        save_steps=10_000,
        save_total_limit=2,
    )

    trainer = Trainer(
        model=model,
        args=args,
        train_dataset=tokenized["train"],
        eval_dataset=tokenized["validation"],
    )

    # 4. Train
    trainer.train()
    model.save_pretrained("./text_emotion_model")
    print("Training complete, model saved in ./text_emotion_model")

if __name__ == "__main__":
    train()
