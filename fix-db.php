<?php
$host = '35.254.6.205';
$db   = 'kpi_system';
$user = 'kpi_user2';
$pass = 'Password123_';
$charset = 'utf8mb4';

$dsn = "mysql:host=$host;dbname=$db;charset=$charset";
$options = [
    PDO::ATTR_ERRMODE            => PDO::ERRMODE_EXCEPTION,
    PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
    PDO::ATTR_EMULATE_PREPARES   => false,
];

try {
     $pdo = new PDO($dsn, $user, $pass, $options);
     $passwordHash = password_hash('password123', PASSWORD_BCRYPT);
     
     // Update manager
     $stmt = $pdo->prepare("UPDATE users SET password = ?, is_active = 1 WHERE username = 'manager'");
     $stmt->execute([$passwordHash]);
     echo "Manager updated.\n";
     
     // Check if andi exists
     $stmt = $pdo->prepare("SELECT id FROM users WHERE username = 'andi'");
     $stmt->execute();
     if ($stmt->fetch()) {
         $stmt = $pdo->prepare("UPDATE users SET password = ?, is_active = 1 WHERE username = 'andi'");
         $stmt->execute([$passwordHash]);
         echo "Andi updated.\n";
     } else {
         $stmt = $pdo->prepare("INSERT INTO users (name, username, email, password, role, department, position, is_active) VALUES (?, ?, ?, ?, ?, ?, ?, ?)");
         $stmt->execute(['Andi Pratama', 'andi', 'andi@kpi.app', $passwordHash, 'employee', 'Engineering', 'Backend Developer', 1]);
         echo "Andi created.\n";
     }
} catch (\PDOException $e) {
     throw new \PDOException($e->getMessage(), (int)$e->getCode());
}
