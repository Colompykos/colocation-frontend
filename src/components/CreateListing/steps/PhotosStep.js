import React from 'react';
import { useDropzone } from 'react-dropzone';

const PhotosStep = ({ formData, setFormData }) => {
  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    accept: {
      'image/*': ['.jpeg', '.jpg', '.png']
    },
    multiple: true,
    maxFiles: 10,
    maxSize: 5242880, // 5MB
    onDrop: acceptedFiles => {
      if (formData.photos.length + acceptedFiles.length > 10) {
        alert('Maximum 10 photos allowed');
        return;
      }
      
      const newPhotos = acceptedFiles.map(file => 
        Object.assign(file, {
          preview: URL.createObjectURL(file),
          isExisting: false // Marquer comme nouvelle photo
        })
      );
      
      setFormData(prev => ({
        ...prev,
        photos: [...prev.photos, ...newPhotos].slice(0, 10)
      }));
    }
  });

  return (
    <div className="step-container">
      <h2>Photos du bien</h2>
      <p className="step-description">Ajoutez jusqu'à 10 photos (max 5MB par photo)</p>

      <div {...getRootProps()} className={`dropzone ${isDragActive ? 'active' : ''}`}>
        <input {...getInputProps()} />
        <p>{isDragActive ? 
          "Déposez les photos ici..." : 
          "Glissez et déposez vos photos ici, ou cliquez pour sélectionner"}
        </p>
      </div>

      {formData.photos.length > 0 && (
        <div className="photos-preview">
          {formData.photos.map((photo, index) => (
            <div key={index} className="photo-preview">
              <img 
                src={photo.preview} 
                alt={`Preview ${index + 1}`}
              />
              <button
                type="button"
                onClick={() => {
                  setFormData(prev => ({
                    ...prev,
                    photos: prev.photos.filter((_, i) => i !== index)
                  }));
                }}
                className="remove-photo"
              >
                ×
              </button>
              
              {photo.isExisting && (
                <div className="existing-photo-badge">
                  Photo existante
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default PhotosStep;