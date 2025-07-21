import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';

/**
 * Mobile-optimized form component with enhanced UX patterns
 * Demonstrates best practices for mobile form design
 */
const MobileOptimizedForm = ({ 
    onSubmit, 
    initialData = {}, 
    fields = [], 
    submitLabel = 'Submit',
    isLoading = false 
}) => {
    const { t } = useTranslation();
    const [formData, setFormData] = useState(initialData);
    const [errors, setErrors] = useState({});
    const [touched, setTouched] = useState({});
    const [isValid, setIsValid] = useState(false);

    // Real-time validation
    useEffect(() => {
        validateForm();
    }, [formData]);

    const validateForm = () => {
        const newErrors = {};
        let valid = true;

        fields.forEach(field => {
            const value = formData[field.name];
            
            // Required field validation
            if (field.required && (!value || value.toString().trim() === '')) {
                newErrors[field.name] = t('form.validation.required');
                valid = false;
            }
            
            // Type-specific validation
            if (value && field.type === 'email') {
                const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
                if (!emailRegex.test(value)) {
                    newErrors[field.name] = t('form.validation.invalid_email');
                    valid = false;
                }
            }
            
            if (value && field.type === 'number') {
                if (isNaN(value) || parseFloat(value) < 0) {
                    newErrors[field.name] = t('form.validation.invalid_number');
                    valid = false;
                }
            }

            // Custom validation
            if (field.validate && value) {
                const customError = field.validate(value);
                if (customError) {
                    newErrors[field.name] = customError;
                    valid = false;
                }
            }
        });

        setErrors(newErrors);
        setIsValid(valid && Object.keys(formData).length > 0);
    };

    const handleFieldChange = (fieldName, value) => {
        setFormData(prev => ({
            ...prev,
            [fieldName]: value
        }));
        
        // Mark field as touched
        setTouched(prev => ({
            ...prev,
            [fieldName]: true
        }));
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        
        // Mark all fields as touched to show validation errors
        const allTouched = {};
        fields.forEach(field => {
            allTouched[field.name] = true;
        });
        setTouched(allTouched);

        if (isValid) {
            onSubmit(formData);
        }
    };

    const getInputType = (fieldType) => {
        switch (fieldType) {
            case 'email': return 'email';
            case 'number': return 'number';
            case 'currency': return 'number';
            case 'date': return 'date';
            case 'tel': return 'tel';
            case 'password': return 'password';
            default: return 'text';
        }
    };

    const getInputMode = (fieldType) => {
        switch (fieldType) {
            case 'number':
            case 'currency': return 'decimal';
            case 'tel': return 'tel';
            case 'email': return 'email';
            default: return 'text';
        }
    };

    const getKeyboardType = (fieldType) => {
        // For better mobile keyboard experience
        switch (fieldType) {
            case 'number':
            case 'currency': return { pattern: '[0-9]*' };
            case 'email': return { autoComplete: 'email' };
            case 'tel': return { autoComplete: 'tel' };
            default: return {};
        }
    };

    const FormField = ({ field }) => {
        const value = formData[field.name] || '';
        const hasError = touched[field.name] && errors[field.name];
        const isSuccess = touched[field.name] && !errors[field.name] && value;

        const baseInputClasses = `
            w-full px-4 py-4 text-lg
            bg-[#191E29] border rounded-xl 
            text-white placeholder-gray-400
            transition-all duration-200
            focus:outline-none focus:ring-2
            ${hasError 
                ? 'border-red-500 focus:border-red-500 focus:ring-red-500/20' 
                : isSuccess
                    ? 'border-green-500 focus:border-green-500 focus:ring-green-500/20'
                    : 'border-[#31344d] focus:border-[#01C38D] focus:ring-[#01C38D]/20'
            }
        `;

        const renderInput = () => {
            if (field.type === 'select') {
                return (
                    <select
                        value={value}
                        onChange={(e) => handleFieldChange(field.name, e.target.value)}
                        className={baseInputClasses}
                        required={field.required}
                    >
                        <option value="">{field.placeholder}</option>
                        {field.options?.map(option => (
                            <option key={option.value} value={option.value}>
                                {option.label}
                            </option>
                        ))}
                    </select>
                );
            }

            if (field.type === 'textarea') {
                return (
                    <textarea
                        value={value}
                        onChange={(e) => handleFieldChange(field.name, e.target.value)}
                        placeholder={field.placeholder}
                        className={`${baseInputClasses} min-h-[120px] resize-none`}
                        required={field.required}
                        rows={4}
                    />
                );
            }

            return (
                <input
                    type={getInputType(field.type)}
                    inputMode={getInputMode(field.type)}
                    value={value}
                    onChange={(e) => handleFieldChange(field.name, e.target.value)}
                    placeholder={field.placeholder}
                    className={baseInputClasses}
                    required={field.required}
                    step={field.type === 'currency' ? '0.01' : undefined}
                    min={field.type === 'number' || field.type === 'currency' ? '0' : undefined}
                    {...getKeyboardType(field.type)}
                />
            );
        };

        return (
            <div className="space-y-2">
                {/* Label */}
                <label className="block text-white font-medium text-sm">
                    {field.label}
                    {field.required && <span className="text-red-400 ml-1">*</span>}
                </label>

                {/* Input Container */}
                <div className="relative">
                    {renderInput()}
                    
                    {/* Status Icons */}
                    <div className="absolute right-4 top-1/2 transform -translate-y-1/2">
                        {hasError && (
                            <div className="text-red-400">
                                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                                    <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                                </svg>
                            </div>
                        )}
                        {isSuccess && (
                            <div className="text-green-400">
                                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                                </svg>
                            </div>
                        )}
                    </div>
                </div>

                {/* Help Text */}
                {field.helpText && !hasError && (
                    <p className="text-gray-400 text-sm">{field.helpText}</p>
                )}

                {/* Error Message */}
                {hasError && (
                    <p className="text-red-400 text-sm flex items-center gap-1">
                        <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                        </svg>
                        {errors[field.name]}
                    </p>
                )}
            </div>
        );
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-6">
            {/* Progress Indicator */}
            <div className="mb-6">
                <div className="flex justify-between text-sm text-gray-400 mb-2">
                    <span>{t('form.progress')}</span>
                    <span>{Object.keys(touched).length}/{fields.length}</span>
                </div>
                <div className="w-full bg-[#31344d] rounded-full h-1">
                    <div 
                        className="bg-[#01C38D] h-1 rounded-full transition-all duration-300"
                        style={{ 
                            width: `${(Object.keys(touched).length / fields.length) * 100}%` 
                        }}
                    />
                </div>
            </div>

            {/* Form Fields */}
            {fields.map((field, index) => (
                <FormField key={field.name} field={field} />
            ))}

            {/* Submit Button */}
            <div className="pt-4">
                <button
                    type="submit"
                    disabled={!isValid || isLoading}
                    className={`
                        w-full py-4 px-6 rounded-xl font-bold text-lg
                        transition-all duration-200 
                        flex items-center justify-center gap-3
                        ${isValid && !isLoading
                            ? 'bg-[#01C38D] text-[#191E29] hover:bg-[#01A071] hover:scale-[1.02] shadow-lg hover:shadow-xl'
                            : 'bg-[#31344d] text-gray-400 cursor-not-allowed'
                        }
                    `}
                >
                    {isLoading ? (
                        <>
                            <div className="w-5 h-5 rounded-full border-2 border-current border-t-transparent animate-spin" />
                            {t('form.submitting')}
                        </>
                    ) : (
                        <>
                            {submitLabel}
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                            </svg>
                        </>
                    )}
                </button>
            </div>

            {/* Form Validation Summary */}
            {Object.keys(touched).length > 0 && !isValid && (
                <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-4">
                    <h4 className="text-red-400 font-medium text-sm mb-2">
                        {t('form.validation.please_fix')}
                    </h4>
                    <ul className="space-y-1">
                        {Object.entries(errors).map(([field, error]) => (
                            <li key={field} className="text-red-300 text-sm">
                                • {error}
                            </li>
                        ))}
                    </ul>
                </div>
            )}

            {/* Keyboard Shortcuts Help */}
            <div className="pt-4 border-t border-[#31344d]">
                <details className="text-gray-400">
                    <summary className="text-sm cursor-pointer hover:text-white transition-colors">
                        {t('form.keyboard_shortcuts')}
                    </summary>
                    <div className="mt-2 text-xs space-y-1">
                        <p>• <kbd className="bg-[#31344d] px-1 rounded">Tab</kbd> - {t('form.shortcuts.next_field')}</p>
                        <p>• <kbd className="bg-[#31344d] px-1 rounded">⌘+Enter</kbd> - {t('form.shortcuts.submit')}</p>
                        <p>• <kbd className="bg-[#31344d] px-1 rounded">Esc</kbd> - {t('form.shortcuts.cancel')}</p>
                    </div>
                </details>
            </div>
        </form>
    );
};

export default MobileOptimizedForm; 