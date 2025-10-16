'use client'

import { AuthUIProvider } from '@daveyplate/better-auth-ui'
import { authClient } from '@/lib/auth-client'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import type { ReactNode } from 'react'

export function Providers({ children }: { children: ReactNode }) {
  const router = useRouter()

  return (
    <AuthUIProvider
      authClient={authClient}
      navigate={router.push}
      replace={router.replace}
      onSessionChange={() => {
        // 清除路由缓存 (受保护的路由)
        router.refresh()
      }}
      Link={Link}
      localization={{
        // === 认证相关页面 ===
        SIGN_IN: '登录',
        SIGN_IN_DESCRIPTION: '请输入您的邮箱和密码来登录您的账户',
        SIGN_IN_ACTION: '登录',
        SIGN_UP: '注册',
        SIGN_UP_DESCRIPTION: '创建一个新账户',
        SIGN_UP_ACTION: '创建账户',
        SIGN_OUT: '登出',

        // === 输入字段 ===
        EMAIL: '邮箱',
        EMAIL_PLACEHOLDER: '请输入您的邮箱',
        EMAIL_DESCRIPTION: '请输入您用于登录的邮箱地址',
        EMAIL_INSTRUCTIONS: '请输入有效的邮箱地址',
        PASSWORD: '密码',
        PASSWORD_PLACEHOLDER: '请输入您的密码',
        CURRENT_PASSWORD: '当前密码',
        CURRENT_PASSWORD_PLACEHOLDER: '请输入当前密码',
        NEW_PASSWORD: '新密码',
        NEW_PASSWORD_PLACEHOLDER: '请输入新密码',
        CONFIRM_PASSWORD: '确认密码',
        CONFIRM_PASSWORD_PLACEHOLDER: '请再次输入密码',
        NAME: '姓名',
        NAME_PLACEHOLDER: '请输入您的姓名',
        NAME_DESCRIPTION: '请输入您的全名或显示名称',
        NAME_INSTRUCTIONS: '最多使用32个字符',
        USERNAME: '用户名',
        USERNAME_PLACEHOLDER: '请输入用户名',
        USERNAME_DESCRIPTION: '请输入您要用于登录的用户名',
        USERNAME_INSTRUCTIONS: '最多使用32个字符',

        // === 按钮和操作 ===
        CONTINUE: '继续',
        SAVE: '保存',
        CANCEL: '取消',
        DELETE: '删除',
        DONE: '完成',
        UPLOAD: '上传',
        LINK: '关联',
        UNLINK: '取消关联',

        // === 账户链接 ===
        DONT_HAVE_AN_ACCOUNT: '还没有账户？',
        ALREADY_HAVE_AN_ACCOUNT: '已有账户？',

        // === 忘记密码流程 ===
        FORGOT_PASSWORD_LINK: '忘记了密码？',
        FORGOT_PASSWORD: '忘记密码',
        FORGOT_PASSWORD_DESCRIPTION: '请输入您的邮箱地址，我们将发送重置链接给您',
        FORGOT_PASSWORD_ACTION: '发送重置链接',
        FORGOT_PASSWORD_EMAIL: '请检查您的邮箱，我们已发送密码重置链接',
        RESET_PASSWORD: '重置密码',
        RESET_PASSWORD_DESCRIPTION: '请输入您的新密码',
        RESET_PASSWORD_ACTION: '保存新密码',
        RESET_PASSWORD_SUCCESS: '密码重置成功！您现在可以使用新密码登录',

        // === Magic Link 登录 ===
        MAGIC_LINK: '邮箱验证登录',
        MAGIC_LINK_DESCRIPTION: '我们将向您的邮箱发送登录链接',
        MAGIC_LINK_ACTION: '发送登录链接',
        MAGIC_LINK_EMAIL: '请检查您的邮箱获取登录链接！',

        // === 邮箱验证码登录 ===
        EMAIL_OTP: '邮箱验证码',
        EMAIL_OTP_DESCRIPTION: '请输入您的邮箱以接收验证码',
        EMAIL_OTP_SEND_ACTION: '发送验证码',
        EMAIL_OTP_VERIFY_ACTION: '验证验证码',
        EMAIL_OTP_VERIFICATION_SENT: '请检查您的邮箱获取验证码',

        // === 双因素认证 ===
        TWO_FACTOR: '双因素认证',
        TWO_FACTOR_DESCRIPTION: '请输入您的一次性密码以继续',
        TWO_FACTOR_ACTION: '验证代码',
        TWO_FACTOR_PROMPT: '双因素认证',
        TWO_FACTOR_ENABLED: '双因素认证已启用',
        TWO_FACTOR_DISABLED: '双因素认证已禁用',
        TWO_FACTOR_CARD_DESCRIPTION: '为您的账户添加额外的安全层',
        ENABLE_TWO_FACTOR: '启用双因素认证',
        DISABLE_TWO_FACTOR: '禁用双因素认证',
        TWO_FACTOR_TOTP_LABEL: '使用您的身份验证器扫描二维码',
        TRUST_DEVICE: '信任此设备',
        BACKUP_CODE: '备用代码',
        BACKUP_CODE_PLACEHOLDER: '请输入备用代码',
        BACKUP_CODES: '备用代码',
        BACKUP_CODES_DESCRIPTION:
          '请将这些备用代码保存在安全的地方。如果您丢失了双因素认证方法，可以使用它们来访问您的账户',
        COPY_ALL_CODES: '复制所有代码',

        // === 账户恢复 ===
        RECOVER_ACCOUNT: '恢复账户',
        RECOVER_ACCOUNT_DESCRIPTION: '请输入备用代码以访问您的账户',
        RECOVER_ACCOUNT_ACTION: '恢复账户',
        FORGOT_AUTHENTICATOR: '忘记了身份验证器？',

        // === 设置页面 ===
        SETTINGS: '设置',
        ACCOUNT: '账户',
        SECURITY: '安全',
        AVATAR: '头像',
        AVATAR_DESCRIPTION: '点击头像从您的文件中上传自定义头像',
        AVATAR_INSTRUCTIONS: '头像是可选的，但强烈建议设置',
        UPLOAD_AVATAR: '上传头像',
        DELETE_AVATAR: '删除头像',

        // === 密码管理 ===
        CHANGE_PASSWORD: '修改密码',
        CHANGE_PASSWORD_DESCRIPTION: '输入您的当前密码和新密码',
        CHANGE_PASSWORD_INSTRUCTIONS: '请至少使用8个字符',
        CHANGE_PASSWORD_SUCCESS: '您的密码已更改',
        SET_PASSWORD: '设置密码',
        SET_PASSWORD_DESCRIPTION: '点击下方按钮接收邮件为您的账户设置密码',

        // === 会话管理 ===
        SESSIONS: '活动会话',
        SESSIONS_DESCRIPTION: '管理您的活动会话并撤销访问',
        CURRENT_SESSION: '当前会话',
        SWITCH_ACCOUNT: '切换账户',

        // === 社交账户提供商 ===
        PROVIDERS: '社交账户',
        PROVIDERS_DESCRIPTION: '将您的账户与第三方服务连接',
        SIGN_IN_WITH: '使用 {provider} 登录',
        OR_CONTINUE_WITH: '或继续使用',

        // === 账户删除 ===
        DELETE_ACCOUNT: '删除账户',
        DELETE_ACCOUNT_DESCRIPTION: '永久删除您的账户及其所有内容。此操作不可逆转，请谨慎操作',
        DELETE_ACCOUNT_INSTRUCTIONS: '请确认删除您的账户。此操作不可逆转，请谨慎操作',
        DELETE_ACCOUNT_SUCCESS: '您的账户已被删除',

        // === 通用消息 ===
        UPDATED_SUCCESSFULLY: '更新成功',
        REQUEST_FAILED: '请求失败',
        COPY_TO_CLIPBOARD: '复制到剪贴板',
        COPIED_TO_CLIPBOARD: '已复制到剪贴板',

        // === 邮箱验证 ===
        EMAIL_VERIFICATION: '请检查您的邮箱获取验证链接',
        EMAIL_VERIFY_CHANGE: '请检查您的邮箱以验证更改',
        VERIFY_YOUR_EMAIL: '验证您的邮箱',
        VERIFY_YOUR_EMAIL_DESCRIPTION:
          '请验证您的邮箱地址。请检查您的收件箱获取验证邮件。如果您没有收到邮件，请点击下方按钮重新发送',
        RESEND_VERIFICATION_EMAIL: '重新发送验证邮件',
        RESEND_CODE: '重新发送验证码',

        // === 密钥（Passkey）管理 ===
        PASSKEYS: '通行密钥',
        PASSKEYS_DESCRIPTION: '管理您的通行密钥以进行安全访问',
        PASSKEYS_INSTRUCTIONS: '无需密码即可安全访问您的账户',
        PASSKEY: '通行密钥',
        ADD_PASSKEY: '添加通行密钥',

        // === 组织管理 ===
        ORGANIZATION: '组织',
        ORGANIZATIONS: '组织',
        ORGANIZATIONS_DESCRIPTION: '管理您的组织和成员资格',
        ORGANIZATIONS_INSTRUCTIONS: '创建组织以与其他用户协作',
        CREATE_ORGANIZATION: '创建组织',
        CREATE_ORGANIZATION_SUCCESS: '组织创建成功',
        ORGANIZATION_NAME: '组织名称',
        ORGANIZATION_NAME_PLACEHOLDER: '我的组织',
        ORGANIZATION_NAME_DESCRIPTION: '这是您组织的可见名称',
        ORGANIZATION_NAME_INSTRUCTIONS: '最多使用32个字符',
        ORGANIZATION_SLUG: '组织标识',
        ORGANIZATION_SLUG_PLACEHOLDER: 'my-org',
        ORGANIZATION_SLUG_DESCRIPTION: '这是您组织的URL命名空间',
        ORGANIZATION_SLUG_INSTRUCTIONS: '最多使用48个字符',
        DELETE_ORGANIZATION: '删除组织',
        DELETE_ORGANIZATION_DESCRIPTION: '永久删除您的组织及其所有内容。此操作不可逆转，请谨慎操作',
        DELETE_ORGANIZATION_SUCCESS: '组织删除成功',
        PERSONAL_ACCOUNT: '个人账户',

        // === 成员管理 ===
        MEMBERS: '成员',
        MEMBERS_DESCRIPTION: '添加或删除成员并管理其角色',
        MEMBERS_INSTRUCTIONS: '邀请新成员加入您的组织',
        INVITE_MEMBER: '邀请成员',
        INVITE_MEMBER_DESCRIPTION: '发送邀请以向您的组织添加新成员',
        SEND_INVITATION: '发送邀请',
        SEND_INVITATION_SUCCESS: '邀请发送成功',
        REMOVE_MEMBER: '删除成员',
        REMOVE_MEMBER_SUCCESS: '成员删除成功',
        REMOVE_MEMBER_CONFIRM: '您确定要从组织中删除此成员吗？',

        // === 角色管理 ===
        ROLE: '角色',
        SELECT_ROLE: '选择角色',
        UPDATE_ROLE: '更新角色',
        UPDATE_ROLE_DESCRIPTION: '更新此成员的角色',
        MEMBER_ROLE_UPDATED: '成员角色更新成功',
        OWNER: '所有者',
        ADMIN: '管理员',
        MEMBER: '成员',
        GUEST: '访客',

        // === 邀请管理 ===
        ACCEPT_INVITATION: '接受邀请',
        ACCEPT_INVITATION_DESCRIPTION: '您已被邀请加入一个组织',
        INVITATION_ACCEPTED: '邀请接受成功',
        INVITATION_REJECTED: '邀请拒绝成功',
        INVITATION_EXPIRED: '此邀请已过期',
        ACCEPT: '接受',
        REJECT: '拒绝',
        PENDING_INVITATIONS: '待处理邀请',
        PENDING_INVITATIONS_DESCRIPTION: '管理您组织的待处理邀请',
        CANCEL_INVITATION: '取消邀请',
        INVITATION_CANCELLED: '邀请取消成功',

        // === API 密钥管理 ===
        API_KEYS: 'API 密钥',
        API_KEYS_DESCRIPTION: '管理您的 API 密钥以进行安全访问',
        API_KEYS_INSTRUCTIONS: '生成 API 密钥以编程方式访问您的账户',
        API_KEY: 'API 密钥',
        CREATE_API_KEY: '创建 API 密钥',
        CREATE_API_KEY_DESCRIPTION: '为您的 API 密钥输入唯一名称以区别于其他密钥',
        CREATE_API_KEY_SUCCESS:
          '请复制您的 API 密钥并将其存储在安全的地方。出于安全原因，我们无法再次显示它',
        API_KEY_CREATED: 'API 密钥已创建',
        API_KEY_NAME_PLACEHOLDER: '新 API 密钥',
        DELETE_API_KEY: '删除 API 密钥',
        DELETE_API_KEY_CONFIRM: '您确定要删除此 API 密钥吗？',
        REVOKE: '撤销',
        EXPIRES: '过期时间',
        NEVER_EXPIRES: '永不过期',
        NO_EXPIRATION: '无过期时间',

        // === 错误消息 ===
        INVALID_EMAIL: '请输入有效的邮箱地址',
        INVALID_USERNAME_OR_PASSWORD: '用户名或密码错误',
        EMAIL_NOT_VERIFIED: '请先验证您的邮箱地址',
        UNEXPECTED_ERROR: '发生意外错误，请稍后重试',
        USER_NOT_FOUND: '用户未找到',
        EMAIL_REQUIRED: '邮箱地址为必填项',
        PASSWORD_REQUIRED: '密码为必填项',
        CONFIRM_PASSWORD_REQUIRED: '确认密码为必填项',
        PASSWORDS_DO_NOT_MATCH: '密码不匹配',
        NEW_PASSWORD_REQUIRED: '新密码为必填项',
        BACKUP_CODE_REQUIRED: '备用代码为必填项',
        EMAIL_IS_THE_SAME: '邮箱地址相同',
        SESSION_NOT_FRESH: '您的会话不是最新的。请重新登录',
        GO_BACK: '返回',

        // === 验证规则消息 ===
        IS_REQUIRED: '为必填项',
        IS_INVALID: '无效',
        IS_THE_SAME: '相同',

        // === 隐私和条款 ===
        BY_CONTINUING_YOU_AGREE: '继续即表示您同意',
        TERMS_OF_SERVICE: '服务条款',
        PRIVACY_POLICY: '隐私政策',
        PROTECTED_BY_RECAPTCHA: '此网站受 reCAPTCHA 保护',

        // === 其他通用文本 ===
        APP: '应用',
        USER: '用户',
        UNKNOWN: '未知',
        REMEMBER_ME: '记住我',
        ONE_TIME_PASSWORD: '一次性密码',
      }}
    >
      {children}
    </AuthUIProvider>
  )
}
