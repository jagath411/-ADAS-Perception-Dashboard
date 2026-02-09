import torch
import torch.nn as nn
from torchvision import models, transforms
import numpy as np

class LaneSegmenter:
    def __init__(self, device=None):
        self.device = device if device else torch.device('cuda' if torch.cuda.is_available() else 'cpu')
        self.model = models.segmentation.deeplabv3_resnet50(weights='DeepLabV3_ResNet50_Weights.DEFAULT').to(self.device)
        self.model.eval()
        self.transform = transforms.Compose([
            transforms.ToPILImage(),
            transforms.Resize((520, 520)),
            transforms.ToTensor(),
            transforms.Normalize(mean=[0.485, 0.456, 0.406], std=[0.229, 0.224, 0.225]),
        ])

    def segment(self, frame):
        input_tensor = self.transform(frame).unsqueeze(0).to(self.device)
        with torch.no_grad():
            output = self.model(input_tensor)['out'][0]
        output_predictions = output.argmax(0).byte().cpu().numpy()
        lane_mask = (output_predictions == 15).astype(np.uint8) * 255
        return lane_mask