module.exports = {
  extends: ['@commitlint/config-conventional'],
  rules: {
    // Type枚举
    'type-enum': [
      2,
      'always',
      [
        'feat', // 新功能
        'fix', // 修复
        'docs', // 文档变更
        'style', // 代码格式（不影响代码运行的变动）
        'refactor', // 重构（既不是新增功能，也不是修改bug的代码变动）
        'perf', // 性能优化
        'test', // 增加测试
        'chore', // 构建过程或辅助工具的变动
        'ci', // CI配置文件和脚本的变动
        'build', // 影响构建系统或外部依赖的变动
        'revert', // 回滚
        'clear', // 代码清理等等
      ],
    ],
    // Subject规则
    'subject-case': [0], // 不限制subject大小写
    'subject-max-length': [2, 'always', 50], // subject最大长度
    'subject-min-length': [2, 'always', 5], // subject最小长度
    'subject-empty': [2, 'never'], // subject不能为空
    'subject-full-stop': [2, 'never', '.'], // subject不能以.结尾

    // Type规则
    'type-empty': [2, 'never'], // type不能为空
    'type-case': [2, 'always', 'lower-case'], // type必须小写

    // Header规则
    'header-max-length': [2, 'always', 72], // header最大长度
  },
  // 忽略模式
  ignores: [
    message => message.includes('WIP'), // 忽略包含WIP的提交
  ],
}
