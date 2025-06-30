const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const router = express.Router();

// 配置multer存储
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    const uploadDir = path.join(__dirname, '../uploads');
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: function (req, file, cb) {
    // 生成唯一文件名: 时间戳_原文件名
    const timestamp = Date.now();
    const originalName = Buffer.from(file.originalname, 'latin1').toString('utf8');
    const ext = path.extname(originalName);
    const name = path.basename(originalName, ext);
    cb(null, `${timestamp}_${name}${ext}`);
  }
});

// 文件过滤器
const fileFilter = (req, file, cb) => {
  // 允许的文件类型
  const allowedTypes = [
    // 图片类型
    'image/jpeg',
    'image/jpg', 
    'image/png',
    'image/gif',
    'image/webp',
    'image/bmp',
    'image/tiff',
    'image/svg+xml',
    // 音频类型
    'audio/mpeg',
    'audio/mp3',
    'audio/wav',
    'audio/ogg',
    'audio/aac',
    'audio/flac',
    'audio/m4a',
    'audio/wma',
    'audio/x-wav',
    'audio/x-mpeg',
    // 视频类型
    'video/mp4',
    'video/avi',
    'video/quicktime',
    'video/x-msvideo',
    'video/x-ms-wmv',
    'video/webm',
    'video/ogg',
    'video/3gpp',
    'video/x-flv',
    'video/x-matroska',
    // 文档类型
    'text/plain',
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/vnd.ms-excel',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
  ];
  
  if (allowedTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('不支持的文件类型'), false);
  }
};

// 配置multer
const upload = multer({
  storage: storage,
  fileFilter: fileFilter,
  limits: {
    fileSize: 100 * 1024 * 1024 // 限制文件大小为100MB，支持大型音视频文件
  }
});

// 默认多文件上传路由（直接POST到/api/upload）
router.post('/', upload.array('files', 10), (req, res) => {
  try {
    if (!req.files || req.files.length === 0) {
      return res.status(400).json({
        success: false,
        error: '没有选择文件'
      });
    }

    console.log('📤 文件上传成功:', req.files.length, '个文件');

    const files = req.files.map(file => ({
      filename: file.filename,
      originalname: Buffer.from(file.originalname, 'latin1').toString('utf8'),
      mimetype: file.mimetype,
      size: file.size,
      uploadTime: new Date().toISOString(),
      url: `/api/upload/file/${file.filename}`
    }));

    res.json({
      success: true,
      message: `成功上传 ${req.files.length} 个文件`,
      files: files
    });

  } catch (error) {
    console.error('文件上传错误:', error);
    res.status(500).json({
      success: false,
      error: '文件上传失败'
    });
  }
});

// 单文件上传
router.post('/single', upload.single('file'), (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        error: '没有选择文件'
      });
    }

    console.log('📤 文件上传成功:', req.file.filename);

    res.json({
      success: true,
      message: '文件上传成功',
      data: {
        filename: req.file.filename,
        originalname: Buffer.from(req.file.originalname, 'latin1').toString('utf8'),
        mimetype: req.file.mimetype,
        size: req.file.size,
        uploadTime: new Date().toISOString(),
        url: `/api/upload/file/${req.file.filename}`
      }
    });

  } catch (error) {
    console.error('文件上传错误:', error);
    res.status(500).json({
      success: false,
      error: '文件上传失败'
    });
  }
});

// 多文件上传
router.post('/multiple', upload.array('files', 5), (req, res) => {
  try {
    if (!req.files || req.files.length === 0) {
      return res.status(400).json({
        success: false,
        error: '没有选择文件'
      });
    }

    console.log('📤 批量文件上传成功:', req.files.length, '个文件');

    const uploadedFiles = req.files.map(file => ({
      filename: file.filename,
      originalname: Buffer.from(file.originalname, 'latin1').toString('utf8'),
      mimetype: file.mimetype,
      size: file.size,
      uploadTime: new Date().toISOString(),
      url: `/api/upload/file/${file.filename}`
    }));

    res.json({
      success: true,
      message: `成功上传 ${req.files.length} 个文件`,
      data: uploadedFiles
    });

  } catch (error) {
    console.error('批量文件上传错误:', error);
    res.status(500).json({
      success: false,
      error: '文件上传失败'
    });
  }
});

// 获取上传的文件
router.get('/file/:filename', (req, res) => {
  try {
    const filename = req.params.filename;
    const filePath = path.join(__dirname, '../uploads', filename);
    
    if (!fs.existsSync(filePath)) {
      return res.status(404).json({
        success: false,
        error: '文件不存在'
      });
    }

    res.sendFile(filePath);

  } catch (error) {
    console.error('获取文件错误:', error);
    res.status(500).json({
      success: false,
      error: '获取文件失败'
    });
  }
});

// 获取文件列表
router.get('/list', (req, res) => {
  try {
    const uploadsDir = path.join(__dirname, '../uploads');
    
    if (!fs.existsSync(uploadsDir)) {
      return res.json({
        success: true,
        data: []
      });
    }

    const files = fs.readdirSync(uploadsDir);
    const fileList = files.map(filename => {
      const filePath = path.join(uploadsDir, filename);
      const stats = fs.statSync(filePath);
      
      // 从文件名中提取原始名称
      const parts = filename.split('_');
      const originalname = parts.length > 1 ? parts.slice(1).join('_') : filename;
      
      return {
        filename: filename,
        originalname: originalname,
        size: stats.size,
        uploadTime: stats.birthtime.toISOString(),
        url: `/api/upload/file/${filename}`
      };
    });

    // 按上传时间降序排列
    fileList.sort((a, b) => new Date(b.uploadTime) - new Date(a.uploadTime));

    res.json({
      success: true,
      data: fileList
    });

  } catch (error) {
    console.error('获取文件列表错误:', error);
    res.status(500).json({
      success: false,
      error: '获取文件列表失败'
    });
  }
});

// 删除文件
router.delete('/file/:filename', (req, res) => {
  try {
    const filename = req.params.filename;
    const filePath = path.join(__dirname, '../uploads', filename);
    
    if (!fs.existsSync(filePath)) {
      return res.status(404).json({
        success: false,
        error: '文件不存在'
      });
    }

    fs.unlinkSync(filePath);
    console.log('🗑️ 文件删除成功:', filename);

    res.json({
      success: true,
      message: '文件删除成功'
    });

  } catch (error) {
    console.error('删除文件错误:', error);
    res.status(500).json({
      success: false,
      error: '删除文件失败'
    });
  }
});

// 错误处理中间件
router.use((error, req, res, next) => {
  if (error instanceof multer.MulterError) {
    if (error.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({
        success: false,
        error: '文件大小超过限制（最大100MB）'
      });
    }
    if (error.code === 'LIMIT_FILE_COUNT') {
      return res.status(400).json({
        success: false,
        error: '文件数量超过限制（最多5个）'
      });
    }
  }
  
  if (error.message === '不支持的文件类型') {
    return res.status(400).json({
      success: false,
      error: '不支持的文件类型，请上传图片、音频、视频、文档或PDF文件'
    });
  }

  res.status(500).json({
    success: false,
    error: '文件处理失败'
  });
});

module.exports = router; 