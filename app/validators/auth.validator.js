import Joi from 'joi';

// Email validation pattern
const EMAIL_PATTERN = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;

// Password validation pattern (minimum 8 characters, at least one uppercase, one lowercase, one number)
const PASSWORD_PATTERN = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)[a-zA-Z\d@$!%*?&]{8,}$/;

export const loginValidationSchema = Joi.object({
  email: Joi.string()
    .trim()
    .lowercase()
    .pattern(EMAIL_PATTERN)
    .required()
    .messages({
      'string.empty': 'Email là bắt buộc',
      'string.pattern.base': 'Email không đúng định dạng',
      'any.required': 'Email là bắt buộc'
    }),
    
  password: Joi.string()
    .min(8)
    .max(128)
    .required()
    .messages({
      'string.empty': 'Mật khẩu là bắt buộc',
      'string.min': 'Mật khẩu phải có ít nhất 8 ký tự',
      'string.max': 'Mật khẩu không được quá 128 ký tự',
      'any.required': 'Mật khẩu là bắt buộc'
    })
});

export const registerValidationSchema = Joi.object({
  email: Joi.string()
    .trim()
    .lowercase()
    .pattern(EMAIL_PATTERN)
    .required()
    .messages({
      'string.empty': 'Email là bắt buộc',
      'string.pattern.base': 'Email không đúng định dạng',
      'any.required': 'Email là bắt buộc'
    }),
    
  password: Joi.string()
    .min(8)
    .max(128)
    .pattern(PASSWORD_PATTERN)
    .required()
    .messages({
      'string.empty': 'Mật khẩu là bắt buộc',
      'string.min': 'Mật khẩu phải có ít nhất 8 ký tự',
      'string.max': 'Mật khẩu không được quá 128 ký tự',
      'string.pattern.base': 'Mật khẩu phải chứa ít nhất 1 chữ hoa, 1 chữ thường và 1 số',
      'any.required': 'Mật khẩu là bắt buộc'
    }),
    
  confirmPassword: Joi.string()
    .valid(Joi.ref('password'))
    .required()
    .messages({
      'any.only': 'Xác nhận mật khẩu không khớp',
      'any.required': 'Xác nhận mật khẩu là bắt buộc'
    }),
    
  username: Joi.string()
    .trim()
    .min(2)
    .max(100)
    .required()
    .messages({
      'string.empty': 'Họ tên là bắt buộc',
      'string.min': 'Họ tên phải có ít nhất 2 ký tự',
      'string.max': 'Họ tên không được quá 100 ký tự',
      'any.required': 'Họ tên là bắt buộc'
    })
});

export const forgotPasswordValidationSchema = Joi.object({
  email: Joi.string()
    .trim()
    .lowercase()
    .pattern(EMAIL_PATTERN)
    .required()
    .messages({
      'string.empty': 'Email là bắt buộc',
      'string.pattern.base': 'Email không đúng định dạng',
      'any.required': 'Email là bắt buộc'
    })
});

export const resetPasswordValidationSchema = Joi.object({
  token: Joi.string()
    .required()
    .messages({
      'string.empty': 'Token là bắt buộc',
      'any.required': 'Token là bắt buộc'
    }),
    
  newPassword: Joi.string()
    .min(8)
    .max(128)
    .pattern(PASSWORD_PATTERN)
    .required()
    .messages({
      'string.empty': 'Mật khẩu mới là bắt buộc',
      'string.min': 'Mật khẩu mới phải có ít nhất 8 ký tự',
      'string.max': 'Mật khẩu mới không được quá 128 ký tự',
      'string.pattern.base': 'Mật khẩu mới phải chứa ít nhất 1 chữ hoa, 1 chữ thường và 1 số',
      'any.required': 'Mật khẩu mới là bắt buộc'
    }),
    
  confirmPassword: Joi.string()
    .valid(Joi.ref('newPassword'))
    .required()
    .messages({
      'any.only': 'Xác nhận mật khẩu không khớp',
      'any.required': 'Xác nhận mật khẩu là bắt buộc'
    })
});