export const getCloudinaryUrl = (path: string) => {
    const cloudName = 'dtw0se3wn';
    const baseUrl = `https://res.cloudinary.com/${cloudName}/image/upload`;
    
    // Remove leading slash if present
    const cleanPath = path.startsWith('/') ? path.slice(1) : path;
    
    return `${baseUrl}/${cleanPath}`;
}; 