import React, { useEffect, useRef, useState, useCallback } from 'react';
import './complain.scss';
import { FaTimes, FaUpload } from 'react-icons/fa';
import { toast } from "react-toastify";
import APIMiddleware from '../../data/api/Api-Middleware';
import { useAuthContext } from '../../contexts/Auth-Context';
import { API_ENDPOINT_ADD_FEEDBACK, API_ENDPOINT_GET_FEEDBACK_TYPES } from '../../data/Endpoints-API';
import Select from 'react-select';
const ComplainModal = ({ setOpen }) => {

    const { user } = useAuthContext();

    const [title, setTitle] = useState('');
    const [description, setDescription] = useState('');
    const [images, setImages] = useState([]);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [options, setOptions] = useState([])

    useEffect(() => {
        getFeedbackTypes();
    }, [])

    const getFeedbackTypes = async () => {
        try {
            const response = await APIMiddleware.get(API_ENDPOINT_GET_FEEDBACK_TYPES());
            setOptions(response.data)
        } catch (error) {
            toast.error("No Feedback types found", { position: "top-right" });
        }
    }

    const customStyle = {
        control: (provided, state) => ({
            ...provided,
            minHeight: '27px !important',
            // width: '150px',
            borderColor: '#484848 !important',
            backgroundColor: '#2d2d2d  !important',
            boxShadow: state.isFocused
                ? '0 0 50px #484848 !important'
                : provided.boxShadow,
            cursor: 'pointer',
            '&:hover': {
                borderColor: 'rgb(33, 196, 109) !important',
                cursor: 'pointer',
                boxShadow: '0 0 0 transparent !important',
            },
        }),
        singleValue: (provided, state) => ({
            ...provided,
            paddingLeft: '10px !important',
            borderColor: state.isFocused
                ? 'rgb(33, 196, 109) !important'
                : '#484848 !important',
            color: '#c5c5c5 !important',
        }),
        option: (provided, state, inSettings = true) => ({
            ...provided,
            padding: inSettings ? '0.3rem !important' : '0 !important',
            cursor: 'pointer',
            color: state.isSelected
                ? 'rgb(33, 196, 109) !important'
                : '#c5c5c5 !important',
            borderBottom: '1px solid #232323',
            backgroundColor: state.isSelected ? '#232323 !important' : 'transparent',
            '&:hover': {
                backgroundColor: 'rgb(33, 196, 109) !important',
                color: '#2d2d2d !important',
            },
            '&:nth-last-child(1)': {
                borderBottom: 'none !important',
            },
        }),
        menu: (provided) => ({
            ...provided,
            backgroundColor: '#3b3a3a !important',
            margin: '0.3rem 0.8rem 0 0.8rem !important',
            zIndex: 111,
            left: '-10px'
        }),
        menuList: (provided) => ({
            ...provided,
            maxHeight: '100px', // Reduced height
            minHeight: '3px',
            // width: '150px', // Ensures the menu list width matches the menu container
            overflowY: 'auto',
        }),
    };
    const [selectedOption, setSelectedOption] = useState('');


    const changehandlefunction = (selectedOption) => {
        setSelectedOption(selectedOption);
    }

    const fileInputRef = useRef(null);


    const handleSubmit = async (e) => {
        e.preventDefault();
        setIsSubmitting(true);

        // Validation
        const errors = [];
        if (!title) errors.push("Title is required");
        if (!description) errors.push("Description is required");
        if (!selectedOption) errors.push("Feedback type is required");

        if (errors.length > 0) {
            errors.forEach((error) => {
                toast.error(error, { position: "top-right" });
            });
            setIsSubmitting(false);
            return;
        }

        try {
            const formData = new FormData();
            formData.append('user_id', user.userId);
            formData.append('title', title);
            formData.append('description', description);
            formData.append('feedback_type_id', selectedOption.value);

            images.forEach((image) => {
                formData.append("images[]", image);
            });

            const response = await APIMiddleware.postForm(
                API_ENDPOINT_ADD_FEEDBACK(),
                formData,
                {
                    headers: {
                        'Content-Type': 'multipart/form-data'
                    }
                }
            );

            toast.success('Feedback submitted successfully!');
            setOpen(false);
        } catch (error) {
            console.error('Error submitting feedback:', error);
            toast.error(error.response?.data?.message || 'Failed to submit feedback');
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleImageChange = (e) => {
        const files = Array.from(e.target.files);
        // setImages(Array.from(e.target.files))

        if (files.length > 0) {
            const validImages = files.filter(file => {
                // Validate file type
                const validTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/jpg'];
                const isValidType = validTypes.includes(file.type);

                // Validate file size (2MB max)
                const isValidSize = file.size <= 2 * 1024 * 1024;

                if (!isValidType) {
                    toast.warning(`File ${file.name} has invalid type (only JPG, PNG, GIF allowed)`);
                }
                if (!isValidSize) {
                    toast.warning(`File ${file.name} is too large (max 2MB)`);
                }

                return isValidType && isValidSize;
            });

            setImages(prev => [...prev, ...validImages]);
        }
        if (fileInputRef.current) fileInputRef.current.value = null;
    };

    const removeImage = (indexToRemove) => {
        setImages((prevImages) => prevImages.filter((_, index) => index !== indexToRemove));
    };
    const handleButtonClick = () => {
        if (fileInputRef.current) {
            fileInputRef.current.click();
        }
    };

    return (
        <div className="confirm-box-3" role="true">
            <div className="card">
                <div className="model-header d-flex justify-content-between align-items-center mb-5">
                    <h2>Feedback / Suggestion</h2>
                    <button className="close-icon" onClick={() => setOpen(false)}>
                        <FaTimes />
                    </button>
                </div>

                <form onSubmit={handleSubmit}>
                    <div className="px-8">
                        <div className="mb-5">
                            <label className="text-color mb-5">Enter Title:</label>
                            <input
                                className="amountInput"
                                type="text"
                                placeholder="Enter Title"
                                value={title}
                                onChange={(e) => setTitle(e.target.value)}

                            />
                        </div>
                        <div className='mb-5'>
                            <label className='text-color mb-5'>Select Type:</label>
                            <Select
                                options={options}
                                value={selectedOption}
                                onChange={changehandlefunction}
                                styles={customStyle}
                                isSearchable={false}
                            // menuPortalTarget={document.body}
                            />
                        </div>
                        <div className="mb-5">
                            <label className="text-color mb-5">Enter Description:</label>
                            <textarea
                                id="complain-area"
                                style={{ minHeight: '100px' }}
                                placeholder="Enter Description"
                                value={description}
                                onChange={(e) => setDescription(e.target.value)}

                            />
                        </div>

                        <div className="mb-5">
                            <label className="text-color mb-5">Upload Images (optional):</label>
                            <input
                                type="file"
                                accept="image/*"
                                className='mb-10'
                                name="images[]"
                                multiple
                                onChange={handleImageChange}
                                style={{ display: 'none' }}
                                ref={fileInputRef}
                            />
                            <button
                                type="button"
                                onClick={handleButtonClick}
                                className="custom-upload-btn mb-10"
                                style={{
                                    padding: '10px 20px',
                                    backgroundColor: '#484848',
                                    color: '#fff',
                                    border: 'none',
                                    borderRadius: '6px',
                                    cursor: 'pointer',
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '8px'
                                }}
                            >
                                <FaUpload />
                                {images.length > 0 ? `${images.length} Image(s) Selected` : 'Choose Images'}
                            </button>

                            {images.length > 0 && (
                                <div className="image-preview-container" style={{ marginTop: '10px', display: 'flex', flexWrap: 'wrap', gap: '10px' }}>
                                    {images.map((image, index) => (
                                        <div key={index} style={{ position: 'relative', width: '80px', height: '80px' }}>
                                            <img
                                                src={URL.createObjectURL(image)}
                                                alt={`preview-${index}`}
                                                style={{
                                                    width: '100%',
                                                    height: '100%',
                                                    objectFit: 'cover',
                                                    borderRadius: '6px',
                                                    border: '1px solid #ccc'
                                                }}
                                            />
                                            <button
                                                type="button"
                                                onClick={() => removeImage(index)}
                                                style={{
                                                    position: 'absolute',
                                                    top: '-8px',
                                                    right: '-8px',
                                                    background: 'red',
                                                    color: 'white',
                                                    border: 'none',
                                                    borderRadius: '50%',
                                                    width: '20px',
                                                    height: '20px',
                                                    cursor: 'pointer',
                                                    fontSize: '12px',
                                                    display: 'flex',
                                                    alignItems: 'center',
                                                    justifyContent: 'center',
                                                }}
                                            >
                                                <FaTimes size={10} />
                                            </button>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>

                        <div className="d-flex justify-content-end mt-4">
                            <button type="submit" className="submit-btn">
                                Submit
                            </button>
                        </div>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default React.memo(ComplainModal, (prevProps, nextProps) => {
    return prevProps.setOpen === nextProps.setOpen;
})