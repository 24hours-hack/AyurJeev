import streamlit as st
import tensorflow as tf
import numpy as np
from PIL import Image

# Page configuration
st.set_page_config(
    page_title="Skin Disease Detector",
    page_icon="🧴",
    layout="wide",
    initial_sidebar_state="expanded"
)

# Load skin disease model
@st.cache_resource
def load_skin_model():
    return tf.keras.models.load_model('trained_model.keras')

# Load the model
model = load_skin_model()

# Class labels
class_names = [
    'Actinic keratosis',
    'Atopic Dermatitis',
    'Benign keratosis',
    'Dermatofibroma',
    'Melanocytic nevus',
    'Melanoma',
    'Squamous cell carcinoma',
    'Tinea Ringworm Candidiasis',
    'Vascular lesion'
]

# Prediction function
def predict_skin_disease(image_file):
    image = Image.open(image_file).convert("RGB")
    image_np = np.array(image)
    image_resized = tf.image.resize(image_np, (128, 128))
    input_arr = np.expand_dims(image_resized, axis=0)
    prediction = model.predict(input_arr)
    result_index = np.argmax(prediction)
    return class_names[result_index], image_np

# UI
st.title("🧴 Skin Disease Detection using AI")
st.markdown("Upload a clear image of the affected skin area to detect possible skin conditions.")

uploaded_img = st.file_uploader("Upload Image", type=["jpg", "jpeg", "png"])

if uploaded_img:
    st.image(uploaded_img, caption="Uploaded Image", use_column_width=True)
    if st.button("🔍 Analyze"):
        with st.spinner("Analyzing image..."):
            prediction, img_np = predict_skin_disease(uploaded_img)
            st.image(img_np, caption=f"🩺 Predicted Disease: {prediction}", use_column_width=True)
            st.success(f"✅ Disease Detected: **{prediction}**")
