'use client'
import React, { useState, useEffect } from "react";
import { assets } from "@/assets/assets";
import Image from "next/image";
import { useAppContext } from "@/context/AppContext";
import axios from "axios";
import toast from "react-hot-toast";

const HeaderSliderManager = () => {
    const { getToken } = useAppContext();

    const [sliders, setSliders] = useState([]);
    const [editingSlider, setEditingSlider] = useState(null);
    const [formData, setFormData] = useState({
        title: '',
        offer: '',
        buttonText1: '',
        buttonText2: '',
        isActive: true
    });
    const [files, setFiles] = useState({
        imgSrcSm: null,
        imgSrcMd: null
    });

    // Fetch existing sliders
    const fetchSliders = async () => {
        try {
            const { data } = await axios.get('/api/slider/list');
            if (data.success) {
                setSliders(data.sliders);
            }
        } catch (error) {
            toast.error('Failed to fetch sliders');
        }
    };

    useEffect(() => {
        fetchSliders();
    }, []);

    const handleSubmit = async (e) => {
        e.preventDefault();

        const submitFormData = new FormData();

        submitFormData.append('title', formData.title);
        submitFormData.append('offer', formData.offer);
        submitFormData.append('buttonText1', formData.buttonText1);
        submitFormData.append('buttonText2', formData.buttonText2);
        submitFormData.append('isActive', formData.isActive);

        if (files.imgSrcSm) {
            submitFormData.append('imgSrcSm', files.imgSrcSm);
        }
        if (files.imgSrcMd) {
            submitFormData.append('imgSrcMd', files.imgSrcMd);
        }

        if (editingSlider) {
            submitFormData.append('sliderId', editingSlider._id);
        }

        try {
            const token = await getToken();
            const endpoint = editingSlider ? '/api/slider/update' : '/api/slider/add';

            const { data } = await axios.post(endpoint, submitFormData, {
                headers: { Authorization: `Bearer ${token}` }
            });

            if (data.success) {
                toast.success(data.message);
                resetForm();
                fetchSliders();
            } else {
                toast.error(data.message);
            }
        } catch (error) {
            toast.error(error.message);
        }
    };

    const handleEdit = (slider) => {
        setEditingSlider(slider);
        setFormData({
            title: slider.title,
            offer: slider.offer,
            buttonText1: slider.buttonText1,
            buttonText2: slider.buttonText2,
            isActive: slider.isActive
        });
        setFiles({ imgSrcSm: null, imgSrcMd: null });
    };

    const handleDelete = async (sliderId) => {
        if (!confirm('Are you sure you want to delete this slider?')) return;

        try {
            const token = await getToken();
            const { data } = await axios.delete(`/api/slider/delete/${sliderId}`, {
                headers: { Authorization: `Bearer ${token}` }
            });

            if (data.success) {
                toast.success(data.message);
                fetchSliders();
            } else {
                toast.error(data.message);
            }
        } catch (error) {
            toast.error('Failed to delete slider');
        }
    };

    const resetForm = () => {
        setEditingSlider(null);
        setFormData({
            title: '',
            offer: '',
            buttonText1: '',
            buttonText2: '',
            isActive: true
        });
        setFiles({ imgSrcSm: null, imgSrcMd: null });
    };

    return (
        <div className="flex-1 min-h-screen">
            <div className="md:p-10 p-4 space-y-8">
                <h1 className="text-2xl font-bold">Header Slider Management</h1>

                {/* Form */}
                <form onSubmit={handleSubmit} className="space-y-5 max-w-2xl bg-white p-6 rounded-lg shadow">
                    <h2 className="text-xl font-semibold">
                        {editingSlider ? 'Edit Slider' : 'Add New Slider'}
                    </h2>

                    {/* Images */}
                    <div>
                        <p className="text-base font-medium mb-3">Slider Images</p>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {/* Mobile Image */}
                            <div>
                                <label className="block text-sm font-medium mb-2">Mobile Image</label>
                                <label htmlFor="imgSrcSm" className="cursor-pointer">
                                    <input
                                        onChange={(e) => setFiles(prev => ({ ...prev, imgSrcSm: e.target.files[0] }))}
                                        type="file"
                                        id="imgSrcSm"
                                        hidden
                                        accept="image/*"
                                    />
                                    <div className="w-full h-40 border-2 border-dashed border-gray-300 rounded-lg flex items-center justify-center bg-gray-50 hover:bg-gray-100 transition-colors">
                                        {files.imgSrcSm ? (
                                            <Image
                                                src={URL.createObjectURL(files.imgSrcSm)}
                                                alt="Mobile preview"
                                                width={150}
                                                height={150}
                                                className="object-contain h-full"
                                            />
                                        ) : editingSlider?.imgSrcSm ? (
                                            <Image
                                                src={editingSlider.imgSrcSm}
                                                alt="Current mobile image"
                                                width={150}
                                                height={150}
                                                className="object-contain h-full"
                                            />
                                        ) : (
                                            <div className="text-center">
                                                <p className="text-gray-500">Click to upload mobile image</p>
                                                <p className="text-xs text-gray-400">Recommended: 400x300px</p>
                                            </div>
                                        )}
                                    </div>
                                </label>
                            </div>

                            {/* Desktop Image */}
                            <div>
                                <label className="block text-sm font-medium mb-2">Desktop Image</label>
                                <label htmlFor="imgSrcMd" className="cursor-pointer">
                                    <input
                                        onChange={(e) => setFiles(prev => ({ ...prev, imgSrcMd: e.target.files[0] }))}
                                        type="file"
                                        id="imgSrcMd"
                                        hidden
                                        accept="image/*"
                                    />
                                    <div className="w-full h-40 border-2 border-dashed border-gray-300 rounded-lg flex items-center justify-center bg-gray-50 hover:bg-gray-100 transition-colors">
                                        {files.imgSrcMd ? (
                                            <Image
                                                src={URL.createObjectURL(files.imgSrcMd)}
                                                alt="Desktop preview"
                                                width={150}
                                                height={150}
                                                className="object-contain h-full"
                                            />
                                        ) : editingSlider?.imgSrcMd ? (
                                            <Image
                                                src={editingSlider.imgSrcMd}
                                                alt="Current desktop image"
                                                width={150}
                                                height={150}
                                                className="object-contain h-full"
                                            />
                                        ) : (
                                            <div className="text-center">
                                                <p className="text-gray-500">Click to upload desktop image</p>
                                                <p className="text-xs text-gray-400">Recommended: 800x400px</p>
                                            </div>
                                        )}
                                    </div>
                                </label>
                            </div>
                        </div>
                    </div>

                    {/* Text Fields */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label className="text-base font-medium" htmlFor="title">Title</label>
                            <input
                                id="title"
                                type="text"
                                placeholder="Enter slide title"
                                className="w-full outline-none md:py-2.5 py-2 px-3 rounded border border-gray-500/40 mt-1"
                                value={formData.title}
                                onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                                required
                            />
                        </div>

                        <div>
                            <label className="text-base font-medium" htmlFor="offer">Offer Text</label>
                            <input
                                id="offer"
                                type="text"
                                placeholder="Enter offer text"
                                className="w-full outline-none md:py-2.5 py-2 px-3 rounded border border-gray-500/40 mt-1"
                                value={formData.offer}
                                onChange={(e) => setFormData(prev => ({ ...prev, offer: e.target.value }))}
                                required
                            />
                        </div>

                        <div>
                            <label className="text-base font-medium" htmlFor="buttonText1">Button 1 Text</label>
                            <input
                                id="buttonText1"
                                type="text"
                                placeholder="Primary button text"
                                className="w-full outline-none md:py-2.5 py-2 px-3 rounded border border-gray-500/40 mt-1"
                                value={formData.buttonText1}
                                onChange={(e) => setFormData(prev => ({ ...prev, buttonText1: e.target.value }))}
                                required
                            />
                        </div>

                        <div>
                            <label className="text-base font-medium" htmlFor="buttonText2">Button 2 Text</label>
                            <input
                                id="buttonText2"
                                type="text"
                                placeholder="Secondary button text"
                                className="w-full outline-none md:py-2.5 py-2 px-3 rounded border border-gray-500/40 mt-1"
                                value={formData.buttonText2}
                                onChange={(e) => setFormData(prev => ({ ...prev, buttonText2: e.target.value }))}
                                required
                            />
                        </div>
                    </div>

                    {/* Active Status */}
                    <div className="flex items-center gap-2">
                        <input
                            type="checkbox"
                            id="isActive"
                            checked={formData.isActive}
                            onChange={(e) => setFormData(prev => ({ ...prev, isActive: e.target.checked }))}
                            className="rounded"
                        />
                        <label htmlFor="isActive" className="text-base font-medium">Active</label>
                    </div>

                    {/* Buttons */}
                    <div className="flex gap-3">
                        <button
                            type="submit"
                            className="px-8 py-2.5 bg-black text-white font-medium rounded hover:bg-gray-800 transition-colors"
                        >
                            {editingSlider ? 'Update' : 'Add'} Slider
                        </button>

                        {editingSlider && (
                            <button
                                type="button"
                                onClick={resetForm}
                                className="px-8 py-2.5 bg-gray-500 text-white font-medium rounded hover:bg-gray-600 transition-colors"
                            >
                                Cancel
                            </button>
                        )}
                    </div>
                </form>

                {/* Existing Sliders */}
                <div className="space-y-4">
                    <h2 className="text-xl font-semibold">Existing Sliders</h2>

                    {sliders.length === 0 ? (
                        <p className="text-gray-500">No sliders found.</p>
                    ) : (
                        <div className="grid gap-4">
                            {sliders.map((slider) => (
                                <div key={slider._id} className="bg-white p-4 rounded-lg shadow border">
                                    <div className="flex justify-between items-start mb-3">
                                        <div>
                                            <h3 className="font-semibold text-lg">{slider.title}</h3>
                                            <p className="text-gray-600">{slider.offer}</p>
                                            <div className="flex gap-2 mt-1">
                                                <span className="text-sm bg-gray-100 px-2 py-1 rounded">{slider.buttonText1}</span>
                                                <span className="text-sm bg-gray-100 px-2 py-1 rounded">{slider.buttonText2}</span>
                                            </div>
                                        </div>
                                        <div className="flex gap-2">
                                            <span className={`px-2 py-1 rounded text-xs ${slider.isActive ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                                                {slider.isActive ? 'Active' : 'Inactive'}
                                            </span>
                                        </div>
                                    </div>

                                    <div className="flex gap-4 mb-3">
                                        {slider.imgSrcSm && (
                                            <div>
                                                <p className="text-xs text-gray-500 mb-1">Mobile</p>
                                                <Image
                                                    src={slider.imgSrcSm}
                                                    alt="Mobile"
                                                    width={100}
                                                    height={75}
                                                    className="object-cover rounded border"
                                                />
                                            </div>
                                        )}
                                        {slider.imgSrcMd && (
                                            <div>
                                                <p className="text-xs text-gray-500 mb-1">Desktop</p>
                                                <Image
                                                    src={slider.imgSrcMd}
                                                    alt="Desktop"
                                                    width={100}
                                                    height={75}
                                                    className="object-cover rounded border"
                                                />
                                            </div>
                                        )}
                                    </div>

                                    <div className="flex gap-2">
                                        <button
                                            onClick={() => handleEdit(slider)}
                                            className="px-4 py-2 bg-blue-500 text-white rounded text-sm hover:bg-blue-600 transition-colors"
                                        >
                                            Edit
                                        </button>
                                        <button
                                            onClick={() => handleDelete(slider._id)}
                                            className="px-4 py-2 bg-red-500 text-white rounded text-sm hover:bg-red-600 transition-colors"
                                        >
                                            Delete
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default HeaderSliderManager;