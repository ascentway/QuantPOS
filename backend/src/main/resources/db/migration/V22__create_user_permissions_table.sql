CREATE TABLE IF NOT EXISTS user_permissions (
    user_id UUID NOT NULL,
    permission VARCHAR(255) NOT NULL,
    CONSTRAINT fk_user_permissions_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    UNIQUE (user_id, permission)
);

CREATE INDEX idx_user_permissions_user_id ON user_permissions(user_id);
