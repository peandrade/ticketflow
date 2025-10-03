'use client';

import React from 'react';

type SalesPolicy = {
  serviceFeePercent: number;
  limitPerCpf: number;
  halfTicketsPerCpf?: number;
  onlineSaleOpensAt: Date;
  boxOfficeOpensAt?: Date;
  onlinePayments: string;
  boxOfficePayments: string;
  buyUrl?: string;
};

type Props = { policy: SalesPolicy };

const df = new Intl.DateTimeFormat('pt-BR', {
  day: '2-digit',
  month: '2-digit',
  year: 'numeric',
  hour: '2-digit',
  minute: '2-digit',
});

export function SalesPolicy({ policy }: Props) {
  return (
    <section
      aria-labelledby="sales-title"
      className="rounded-xl bg-white p-4 md:p-6"
    >
      <h3 id="sales-title" className="mb-3 font-semibold">
        Informações de venda
      </h3>

      <dl className="space-y-2">
        <div className="flex flex-wrap gap-x-2">
          <dt className="font-semibold after:ml-0.5 after:content-[':']">Taxa de serviço online</dt>
          <dd>{policy.serviceFeePercent}%</dd>
        </div>

        <div className="flex flex-wrap gap-x-2">
          <dt className="font-semibold after:ml-0.5 after:content-[':']">
            Limite de ingressos por CPF
          </dt>
          <dd>
            {policy.limitPerCpf}
            {policy.halfTicketsPerCpf ? ` (máx. ${policy.halfTicketsPerCpf} meias)` : null}
          </dd>
        </div>

        <div className="flex flex-wrap gap-x-2">
          <dt className="font-semibold after:ml-0.5 after:content-[':']">Início das vendas</dt>
          <dd>
            {df.format(policy.onlineSaleOpensAt)}
            {policy.buyUrl ? (
              <>
                {' '}
                em{' '}
                <a rel="noreferrer" className="underline">
                  ticketflow.com.br
                </a>
              </>
            ) : null}
            {policy.boxOfficeOpensAt && (
              <> e às {df.format(policy.boxOfficeOpensAt)} na Bilheteria Oficial</>
            )}
          </dd>
        </div>

        <div className="flex flex-wrap gap-1">
          <dt className="font-semibold after:ml-0.5 after:content-[':']">Para compras online</dt>
          <dd>{policy.onlinePayments}</dd>
        </div>

        <div className="flex flex-wrap gap-1">
          <dt className="font-semibold after:ml-0.5 after:content-[':']">
            Para compras na Bilheteria Oficial
          </dt>
          <dd>{policy.boxOfficePayments}</dd>
        </div>
      </dl>
    </section>
  );
}
