-- RN3D CATALOG PRODUCTS SEED SCRIPT
-- Execute this script in your Supabase SQL Editor to populate all official catalog products into PostgreSQL.

-- 1. Ensure storage_capacity column exists
ALTER TABLE products ADD COLUMN IF NOT EXISTS storage_capacity text;

-- 2. Insert or update official catalog products
INSERT INTO products (name, sku, category, storage_capacity, material, color, standard_price, current_stock, status) VALUES
  -- Case Elite Rosqueável (50 munições)
  ('Case Elite Rosqueável 9mm', '7991', 'Case de Munição', '50 munições', 'PLA', 'Verde Oliva', 45.00, 20, 'Ativo'),
  ('Case Elite Rosqueável .22 LR', '5012', 'Case de Munição', '50 munições', 'PLA', 'Preto', 45.00, 20, 'Ativo'),
  ('Case Elite Rosqueável .380 ACP', '9157', 'Case de Munição', '50 munições', 'PLA', 'Preto', 45.00, 20, 'Ativo'),
  ('Case Elite Rosqueável .45 ACP', '1188', 'Case de Munição', '50 munições', 'PLA', 'Preto', 45.00, 20, 'Ativo'),
  ('Case Elite Rosqueável .357 Magnum', '1545', 'Case de Munição', '50 munições', 'PLA', 'Branco', 45.00, 20, 'Ativo'),
  ('Case Elite Rosqueável .22 Magnum', '9764', 'Case de Munição', '50 munições', 'PLA', 'Preto', 45.00, 20, 'Ativo'),
  ('Case Elite Rosqueável .44 Magnum', '3078', 'Case de Munição', '50 munições', 'PLA', 'Preto', 45.00, 20, 'Ativo'),
  ('Case Elite Rosqueável .38 Special', '5393', 'Case de Munição', '50 munições', 'PLA', 'Preto', 45.00, 20, 'Ativo'),
  ('Case Elite Rosqueável .17 Mach 2', '1200', 'Case de Munição', '50 munições', 'PLA', 'Preto', 45.00, 20, 'Ativo'),
  ('Case Elite Rosqueável 10mm', '3110', 'Case de Munição', '50 munições', 'PLA', 'Preto', 45.00, 20, 'Ativo'),
  ('Case Elite Rosqueável .40 S&W', '1149', 'Case de Munição', '50 munições', 'PLA', 'Preto', 45.00, 20, 'Ativo'),
  ('Case Elite Rosqueável .45 Colt', '1487', 'Case de Munição', '50 munições', 'PLA', 'Preto', 45.00, 20, 'Ativo'),
  ('Case Elite Rosqueável 5.7×28mm', '5044', 'Case de Munição', '50 munições', 'PLA', 'Preto', 45.00, 20, 'Ativo'),
  ('Case Elite Rosqueável .17 HMR', '1876', 'Case de Munição', '50 munições', 'PLA', 'Preto', 45.00, 20, 'Ativo'),
  ('Case Elite Rosqueável .223 Remington', '9978', 'Case de Munição', '50 munições', 'PLA', 'Preto', 45.00, 20, 'Ativo'),
  ('Case Elite Rosqueável 5.56mm', '4919', 'Case de Munição', '50 munições', 'PLA', 'Preto', 45.00, 20, 'Ativo'),
  ('Case Elite Rosqueável .308 Winchester', '5087', 'Case de Munição', '50 munições', 'PLA', 'Preto', 45.00, 20, 'Ativo'),
  ('Case Elite Rosqueável .30-06 Springfield', '8068', 'Case de Munição', '50 munições', 'PLA', 'Preto', 45.00, 20, 'Ativo'),
  ('Case Elite Rosqueável .243 Winchester', '5800', 'Case de Munição', '50 munições', 'PLA', 'Preto', 45.00, 20, 'Ativo'),
  ('Case Elite Rosqueável .300 Blackout', '5422', 'Case de Munição', '50 munições', 'PLA', 'Preto', 45.00, 20, 'Ativo'),

  -- Case American Rosqueável (50 munições)
  ('Case American Rosqueável 9mm', '8377', 'Case de Munição', '50 munições', 'PLA', 'Verde Oliva', 40.00, 20, 'Ativo'),
  ('Case American Rosqueável .22 LR', '9750', 'Case de Munição', '50 munições', 'PLA', 'Preto', 40.00, 20, 'Ativo'),
  ('Case American Rosqueável .32 ACP', '6488', 'Case de Munição', '50 munições', 'PLA', 'Preto', 40.00, 20, 'Ativo'),
  ('Case American Rosqueável .380 ACP', '8674', 'Case de Munição', '50 munições', 'PLA', 'Preto', 40.00, 20, 'Ativo'),
  ('Case American Rosqueável .40 S&W', '4952', 'Case de Munição', '50 munições', 'PLA', 'Preto', 40.00, 20, 'Ativo'),
  ('Case American Rosqueável .45 ACP', '9419', 'Case de Munição', '50 munições', 'PLA', 'Preto', 40.00, 20, 'Ativo'),
  ('Case American Rosqueável .357 Magnum', '4900', 'Case de Munição', '50 munições', 'PLA', 'Preto', 40.00, 20, 'Ativo'),
  ('Case American Rosqueável 5.56mm / .223', '5377', 'Case de Munição', '50 munições', 'PLA', 'Preto', 40.00, 20, 'Ativo'),
  ('Case American Rosqueável .243 Winchester', '2694', 'Case de Munição', '50 munições', 'PLA', 'Preto', 40.00, 20, 'Ativo'),
  ('Case American Rosqueável .270 Winchester', '4956', 'Case de Munição', '50 munições', 'PLA', 'Preto', 40.00, 20, 'Ativo'),
  ('Case American Rosqueável .300 Blackout', '8304', 'Case de Munição', '50 munições', 'PLA', 'Preto', 40.00, 20, 'Ativo'),
  ('Case American Rosqueável .308 Winchester', '2830', 'Case de Munição', '50 munições', 'PLA', 'Preto', 40.00, 20, 'Ativo'),
  ('Case American Rosqueável .30-06 Springfield', '3507', 'Case de Munição', '50 munições', 'PLA', 'Preto', 40.00, 20, 'Ativo'),
  ('Case American Rosqueável 6mm ARC', '6397', 'Case de Munição', '50 munições', 'PLA', 'Preto', 40.00, 20, 'Ativo'),

  -- Case Skull v1 (25 munições)
  ('Case Skull v1 9mm', '4694', 'Case de Munição', '25 munições', 'PLA', 'Preto', 35.00, 20, 'Ativo'),
  ('Case Skull v1 .380 ACP', '6723', 'Case de Munição', '25 munições', 'PLA', 'Preto', 35.00, 20, 'Ativo'),

  -- Case Skull v2 Modular (50 munições)
  ('Case Skull v2 Modular 9mm', '6119', 'Case de Munição', '50 munições', 'PLA', 'Preto', 50.00, 20, 'Ativo'),
  ('Case Skull v2 Modular .22 LR', '7680', 'Case de Munição', '50 munições', 'PLA', 'Preto', 50.00, 20, 'Ativo'),
  ('Case Skull v2 Modular .38 Super', '2169', 'Case de Munição', '50 munições', 'PLA', 'Preto', 50.00, 20, 'Ativo'),
  ('Case Skull v2 Modular .38 Special', '6881', 'Case de Munição', '50 munições', 'PLA', 'Preto', 50.00, 20, 'Ativo'),

  -- Case Skull v3 Modular (100 munições)
  ('Case Skull v3 Modular 9mm', '6274-S3', 'Case de Munição', '100 munições', 'PLA', 'Preto', 80.00, 20, 'Ativo'),
  ('Case Skull v3 Modular 10mm', '9514-S3', 'Case de Munição', '100 munições', 'PLA', 'Preto', 80.00, 20, 'Ativo'),
  ('Case Skull v3 Modular .22 LR', '3353-S3', 'Case de Munição', '100 munições', 'PLA', 'Preto', 80.00, 20, 'Ativo'),
  ('Case Skull v3 Modular .380', '9506-S3', 'Case de Munição', '100 munições', 'PLA', 'Preto', 80.00, 20, 'Ativo'),
  ('Case Skull v3 Modular .40', '7515-S3', 'Case de Munição', '100 munições', 'PLA', 'Preto', 80.00, 20, 'Ativo'),
  ('Case Skull v3 Modular .45', '7496-S3', 'Case de Munição', '100 munições', 'PLA', 'Preto', 80.00, 20, 'Ativo'),

  -- Case Head 9mm
  ('Case Head 9mm', '6767-HEAD', 'Case de Munição', '50 munições', 'PLA', 'Preto', 60.00, 20, 'Ativo'),

  -- Case Vault
  ('Case Vault .22 LR', '6274-VAULT', 'Case de Munição', '55 munições', 'PLA', 'Preto', 55.00, 20, 'Ativo'),
  ('Case Vault .380 ACP', '9514-VAULT', 'Case de Munição', '20 munições', 'PLA', 'Preto', 55.00, 20, 'Ativo'),
  ('Case Vault 9mm', '3353-VAULT', 'Case de Munição', '20 munições', 'PLA', 'Preto', 55.00, 20, 'Ativo'),
  ('Case Vault .38 Special', '9506-VAULT', 'Case de Munição', '20 munições', 'PLA', 'Preto', 55.00, 20, 'Ativo'),
  ('Case Vault .357 Magnum', '7515-VAULT', 'Case de Munição', '20 munições', 'PLA', 'Preto', 55.00, 20, 'Ativo'),
  ('Case Vault .40 S&W', '7496-VAULT', 'Case de Munição', '20 munições', 'PLA', 'Preto', 55.00, 20, 'Ativo'),
  ('Case Vault .45 ACP', '6767-VAULT', 'Case de Munição', '16 munições', 'PLA', 'Preto', 55.00, 20, 'Ativo'),
  ('Case Vault 5.56 NATO', '4077-VAULT', 'Case de Munição', '20 munições', 'PLA', 'Preto', 55.00, 20, 'Ativo'),
  ('Case Vault .223 Remington', '1288-VAULT', 'Case de Munição', '20 munições', 'PLA', 'Preto', 55.00, 20, 'Ativo'),
  ('Case Vault .300 Blackout', '3928-VAULT', 'Case de Munição', '20 munições', 'PLA', 'Preto', 55.00, 20, 'Ativo'),
  ('Case Vault .308 Win / 7.62×51', '2968-VAULT', 'Case de Munição', '16 munições', 'PLA', 'Preto', 55.00, 20, 'Ativo'),
  ('Case Vault 7.62×39', '9147-VAULT', 'Case de Munição', '16 munições', 'PLA', 'Preto', 55.00, 20, 'Ativo'),
  ('Case Vault .243 Winchester', '5259-VAULT', 'Case de Munição', '16 munições', 'PLA', 'Preto', 55.00, 20, 'Ativo'),

  -- Case Box Empilhável
  ('Case Box Empilhável .22 LR', '6274-BOX', 'Case de Munição', '30 munições (Pocket)', 'PLA', 'Preto', 30.00, 20, 'Ativo'),
  ('Case Box Empilhável .22 LR', '9514-BOX', 'Case de Munição', '105 munições', 'PLA', 'Preto', 70.00, 20, 'Ativo'),
  ('Case Box Empilhável .22 LR', '3353-BOX', 'Case de Munição', '210 munições', 'PLA', 'Preto', 110.00, 20, 'Ativo'),
  ('Case Box Empilhável .380 ACP', '9506-BOX', 'Case de Munição', '50 munições', 'PLA', 'Preto', 50.00, 20, 'Ativo'),
  ('Case Box Empilhável 9mm', '7515-BOX', 'Case de Munição', '20 munições (Pocket)', 'PLA', 'Preto', 25.00, 20, 'Ativo'),
  ('Case Box Empilhável 9mm', '7496-BOX', 'Case de Munição', '25 munições', 'PLA', 'Preto', 30.00, 20, 'Ativo'),
  ('Case Box Empilhável 9mm', '6767-BOX', 'Case de Munição', '50 munições', 'PLA', 'Preto', 50.00, 20, 'Ativo'),
  ('Case Box Empilhável 9mm', '4077-BOX', 'Case de Munição', '100 munições', 'PLA', 'Preto', 85.00, 20, 'Ativo'),
  ('Case Box Empilhável 9mm', '1288-BOX', 'Case de Munição', '200 munições', 'PLA', 'Preto', 150.00, 20, 'Ativo'),
  ('Case Box Empilhável .38 Special', '3928-BOX', 'Case de Munição', '50 munições', 'PLA', 'Preto', 50.00, 20, 'Ativo'),
  ('Case Box Empilhável .357 Magnum', '2968-BOX', 'Case de Munição', '50 munições', 'PLA', 'Preto', 50.00, 20, 'Ativo'),
  ('Case Box Empilhável .40 S&W', '9147-BOX', 'Case de Munição', '50 munições', 'PLA', 'Preto', 50.00, 20, 'Ativo'),
  ('Case Box Empilhável .45 ACP', '5259-BOX', 'Case de Munição', '16 munições (Pocket)', 'PLA', 'Preto', 25.00, 20, 'Ativo'),
  ('Case Box Empilhável .45 ACP', '5548-BOX', 'Case de Munição', '50 munições', 'PLA', 'Preto', 55.00, 20, 'Ativo'),
  ('Case Box Empilhável 5.56 NATO / .223', '2752-BOX', 'Case de Munição', '20 munições', 'PLA', 'Preto', 45.00, 20, 'Ativo'),
  ('Case Box Empilhável .300 Blackout', '7126-BOX', 'Case de Munição', '20 munições', 'PLA', 'Preto', 45.00, 20, 'Ativo'),
  ('Case Box Empilhável .308 Win / 7.62×51', '7311-BOX', 'Case de Munição', '8 munições (Pocket)', 'PLA', 'Preto', 30.00, 20, 'Ativo'),
  ('Case Box Empilhável .308 Win / 7.62×51', '1650-BOX', 'Case de Munição', '20 munições', 'PLA', 'Preto', 50.00, 20, 'Ativo'),
  ('Case Box Empilhável .308 Win / 7.62×51', '2450-BOX', 'Case de Munição', '50 munições', 'PLA', 'Preto', 90.00, 20, 'Ativo'),
  ('Case Box Empilhável 7.62×39', '7894-BOX', 'Case de Munição', '20 munições', 'PLA', 'Preto', 50.00, 20, 'Ativo'),
  ('Case Box Empilhável .243 Winchester', '4515-BOX', 'Case de Munição', '8 munições (Pocket)', 'PLA', 'Preto', 30.00, 20, 'Ativo'),
  ('Case Box Empilhável .243 Winchester', '4468-BOX', 'Case de Munição', '20 munições', 'PLA', 'Preto', 50.00, 20, 'Ativo'),
  ('Case Box Empilhável 6.5 Creedmoor', '6066-BOX', 'Case de Munição', '8 munições (Pocket)', 'PLA', 'Preto', 30.00, 20, 'Ativo'),
  ('Case Box Empilhável 6.5 Creedmoor', '3580-BOX', 'Case de Munição', '20 munições', 'PLA', 'Preto', 50.00, 20, 'Ativo'),
  ('Case Box Empilhável .30-06 Springfield', '5601-BOX', 'Case de Munição', '20 munições', 'PLA', 'Preto', 55.00, 20, 'Ativo'),
  ('Case Box Empilhável .300 Win Mag', '9586-BOX', 'Case de Munição', '20 munições', 'PLA', 'Preto', 60.00, 20, 'Ativo'),
  ('Case Box Empilhável Calibre 12', '6152-BOX', 'Case de Munição', '5 cartuchos', 'PLA', 'Preto', 35.00, 20, 'Ativo'),
  ('Case Box Empilhável Calibre 20', '7120-BOX', 'Case de Munição', '5 cartuchos', 'PLA', 'Preto', 35.00, 20, 'Ativo'),

  -- Fidgets e Acessórios
  ('Fidget Mini Glock 9x5cm', 'F-8456', 'Fidgets', 'Réplica Fidget', 'PLA', 'Preto', 25.00, 30, 'Ativo'),
  ('Fidget Mini Sig Sauer P365 9x5cm', 'F-1937', 'Fidgets', 'Réplica Fidget', 'PLA', 'Preto', 25.00, 30, 'Ativo'),
  ('Fidget Mini CZ Shadow 9x5cm', 'F-6284', 'Fidgets', 'Réplica Fidget', 'PLA', 'Preto', 25.00, 30, 'Ativo'),
  ('Fidget Mini AK-19', 'F-5071', 'Fidgets', 'Réplica Fidget', 'PLA', 'Preto', 35.00, 25, 'Ativo'),
  ('Fidget Mini AR-15 / M4', 'F-9143', 'Fidgets', 'Réplica Fidget', 'PLA', 'Preto', 35.00, 25, 'Ativo'),
  ('Fidget Mini Colt 1911 9x5cm', 'F-3728', 'Fidgets', 'Réplica Fidget', 'PLA', 'Preto', 25.00, 30, 'Ativo'),
  ('Fidget Mini Beretta M9 9x5cm', 'F-4865', 'Fidgets', 'Réplica Fidget', 'PLA', 'Preto', 25.00, 30, 'Ativo'),
  ('Fidget Mini Revolver 9x5cm', 'F-7519', 'Fidgets', 'Réplica Fidget', 'PLA', 'Preto', 25.00, 30, 'Ativo'),
  ('Red Dot Glock', 'F-2604', 'Acessórios', 'Acessório Fidget', 'PLA', 'Preto', 10.00, 40, 'Ativo'),
  ('Carregador Estendido Glock', 'F-8932', 'Acessórios', 'Acessório Fidget', 'PLA', 'Preto', 12.00, 40, 'Ativo'),
  ('Flashlight Glock', 'F-1147', 'Acessórios', 'Acessório Fidget', 'PLA', 'Preto', 10.00, 40, 'Ativo'),
  ('Coldre Glock', 'F-5398', 'Acessórios', 'Acessório Fidget', 'PLA', 'Preto', 15.00, 40, 'Ativo'),
  ('Base de Mesa Glock', 'F-6821', 'Acessórios', 'Acessório Fidget', 'PLA', 'Preto', 15.00, 40, 'Ativo'),
  ('Suporte de Parede', 'F-9475', 'Acessórios', 'Acessório Multi-Modelos', 'PLA', 'Preto', 20.00, 40, 'Ativo')
ON CONFLICT (sku) DO UPDATE SET
  name = EXCLUDED.name,
  category = EXCLUDED.category,
  storage_capacity = EXCLUDED.storage_capacity,
  standard_price = EXCLUDED.standard_price;
