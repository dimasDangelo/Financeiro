CREATE DATABASE IF NOT  EXISTS financeiro;

use financeiro;


CREATE TABLE IF NOT EXISTS cartao (
    id int auto_increment primary key,
    nome VARCHAR(20),
    limite decimal(10,2),
    fechamento_dia int,
    vencimento_dia int,
    ativo  BOOLEAN default true
);

CREATE table IF NOT EXISTS transacao (
    id int auto_increment primary key,
    tipo enum('ENTRADA', 'SAIDA') NOT NULL,
    descricao varchar(100),
    valor decimal(10,2) not null,
    data_movimento date not null,
    forma_pagamento enum('DEBITO', 'CREDITO') not null,
    cartao_id int null,
    total_parcelas int default 1,
    criado_em timestamp default current_timestamp,
    CONSTRAINT fk_transacao_cartao
        FOREIGN KEY (cartao_id)
        REFERENCES cartao(id)
    );
    
CREATE TABLE IF NOT EXISTS parcela(
 id int auto_increment primary key,
 transacao_id int not null, 
 numero_parcela int not null,
 valor decimal (10,2) not null,
 data_vencimento date not null,
 paga BOOLEAN default false,
 CONSTRAINT fk_parcela_transacao
 foreign key (transacao_id) references transacao(id)
)
    