/* Demonstration-only booking. Corporate authentication and schedule are not connected. */
(() => {
  'use strict';
  const $ = (selector, context = document) => context.querySelector(selector);
  const agenda = window.SelenaDemoAgenda;
  const LIMIT = 2;
  const names = {
    claudio: 'Profissional A',
    andrey: 'Profissional B',
    lindaura: 'Profissional C',
    matheus: 'Profissional D',
    regina: 'Profissional E',
    anapaula: 'Profissional F',
    silvania: 'Profissional G',
    silvana: 'Profissional G',
    joao: 'Profissional H'
  };
  let bookings = [];
  function refresh() {
    bookings = agenda.records().filter((item) => item.owner === 'alicia-demo' && names[item.professional]);
    renderRecords();
  }

  function todayInSaoPaulo() {
    const parts = new Intl.DateTimeFormat('en-US', {
      timeZone: 'America/Sao_Paulo', year: 'numeric', month: '2-digit',
      day: '2-digit', hour: '2-digit', minute: '2-digit', hourCycle: 'h23'
    }).formatToParts(new Date());
    const value = (type) => parts.find((part) => part.type === type)?.value || '00';
    return { date: value('year') + '-' + value('month') + '-' + value('day'),
      time: value('hour') + 'h' + value('minute') };
  }

  function weekStart(dayKey) {
    const [year, month, day] = dayKey.split('-').map(Number);
    const date = new Date(Date.UTC(year, month - 1, day));
    date.setUTCDate(date.getUTCDate() - ((date.getUTCDay() + 6) % 7));
    return date.toISOString().slice(0, 10);
  }

  function countForWeek(dayKey) {
    const week = weekStart(dayKey);
    return bookings.filter((booking) => booking.status !== 'canceled' &&
      weekStart(booking.date) === week).length;
  }

  function updateCounter(date = todayInSaoPaulo().date) {
    const count = countForWeek(date);
    const when = weekStart(date) === weekStart(todayInSaoPaulo().date) ? 'nesta semana' : 'na semana selecionada';
    $('#eligibility-counter').textContent = 'Você utilizou ' + count + ' de ' + LIMIT +
      ' massagens ' + when + (count >= LIMIT ? '. Limite semanal atingido.' : '.');
    $('#eligibility-banner').classList.toggle('limit-reached', count >= LIMIT);
  }

  function longDate(dateKey) {
    const [year, month, day] = dateKey.split('-').map(Number);
    return new Intl.DateTimeFormat('pt-BR', { dateStyle: 'long' })
      .format(new Date(year, month - 1, day));
  }

  function appendReviewExample(list) {
    const card = document.createElement('article');
    card.className = 'booking-record booking-record--example';
    const label = document.createElement('p');
    label.className = 'section-kicker';
    label.textContent = 'Exemplo fictício · não enviado';
    const heading = document.createElement('h3');
    heading.textContent = 'Avaliação demonstrativa';
    const stars = document.createElement('span');
    stars.className = 'submitted-rating-stars';
    stars.textContent = '★★★★★';
    stars.setAttribute('role', 'img');
    stars.setAttribute('aria-label', 'Nota: 5 de 5 estrelas');
    const comment = document.createElement('p');
    comment.textContent = 'Fui atendida com atenção, me senti à vontade durante a sessão e gostei da experiência.';
    card.append(label, heading, stars, comment);
    list.appendChild(card);
  }

  function renderRecords() {
    const list = $('#collaborator-records-list');
    if (!list) return;
    list.replaceChildren();
    updateCounter($('#calendar-section').dataset.selectedDate || todayInSaoPaulo().date);
    const now = todayInSaoPaulo();
    const next = bookings.filter((item) => ['reserved','arrived','in-progress'].includes(item.status) &&
      (item.date > now.date || (item.date === now.date && item.time >= now.time)))
      .sort((a, b) => (a.date + a.time).localeCompare(b.date + b.time))[0];
    const lastCompleted = bookings.filter((item) => item.status === 'completed')
      .sort((a, b) => (b.date + b.time).localeCompare(a.date + a.time))[0];
    const chip = $('#page-colaborador .appointment-chip');
    if (chip) {
      $('span', chip).textContent = next ? 'Próximo atendimento' :
        lastCompleted ? 'Último atendimento simulado' : 'Próximo atendimento';
      $('strong', chip).textContent = next ? longDate(next.date) + ' · ' + next.time :
        lastCompleted ? longDate(lastCompleted.date) + ' · ' + lastCompleted.time : 'Nenhuma reserva de teste';
      $('small', chip).textContent = next ? names[next.professional] +
        (agenda.isSharedSchedule?.(next.date, next.professional)
          ? ' · Agenda_MVP demonstrativa' : ' · reserva neste navegador') :
        lastCompleted ? names[lastCompleted.professional] + ' · conclusão simulada' :
          'Nenhuma reserva de teste nesta conta.';
    }
    if (!bookings.length) {
      const message = document.createElement('p');
      message.textContent = 'Nenhuma reserva feita nesta demonstração. Avaliações aparecem após a conclusão de um atendimento.';
      list.appendChild(message);
      appendReviewExample(list);
      return;
    }
    [...bookings].sort((a, b) => (b.date + b.time).localeCompare(a.date + a.time))
      .forEach((booking) => {
        const card = document.createElement('article');
        card.className = 'booking-record';
        const heading = document.createElement('h3');
        heading.textContent = names[booking.professional] + ' · ' + longDate(booking.date) + ', ' + booking.time;
        const status = document.createElement('p');
        status.textContent = booking.status === 'completed'
          ? 'Atendimento concluído nesta simulação.'
          : booking.status === 'no-show'
            ? 'Não comparecimento registrado nesta demonstração.'
          : booking.status === 'canceled'
            ? 'Reserva de teste cancelada. Ela não conta como falta sem aviso nem ocupa seu limite semanal.'
            : booking.status === 'arrived' ? 'Você informou sua chegada. O massoterapeuta pode acompanhar na agenda.'
            : booking.status === 'in-progress' ? 'Atendimento em andamento.'
            : agenda.isSharedSchedule?.(booking.date, booking.professional)
              ? 'Reserva confirmada na Agenda_MVP de demonstração.'
              : 'Reserva demonstrativa salva neste navegador e visível no painel profissional.';
        card.append(heading, status);
        if (!['canceled','no-show'].includes(booking.status)) {
          const map=document.createElement('button'); map.type='button'; map.className='button button-outline'; map.textContent='Como chegar à sala';
          map.dataset.openWayfinding=['claudio','andrey','lindaura','matheus'].includes(booking.professional)?'londrina':'sao-paulo'; card.append(map);
        }
        if (booking.status === 'reserved') {
          const arrived=document.createElement('button'); arrived.type='button'; arrived.className='button button-primary'; arrived.textContent='Já cheguei';
          arrived.disabled=booking.date!==todayInSaoPaulo().date;
          arrived.title='Disponível no dia da reserva. É uma declaração de chegada, não valida sua identidade.';
          arrived.addEventListener('click',async()=>{
            if(!confirm('Você já chegou ao local? Sua chegada será informada na agenda.')) return;
            arrived.disabled=true;
            try { await agenda.arriveAsync(booking.id); } catch(error) { window.showToast?.(error.message); arrived.disabled=false; }
          }); card.append(arrived);
          const simulate = document.createElement('button');
          simulate.type = 'button';
          simulate.className = 'button button-outline';
          simulate.textContent = 'Simular conclusão para testar a avaliação';
          simulate.addEventListener('click', async () => {
            try { await agenda.updateAsync(booking.id, 'completed'); }
            catch (error) { window.showToast?.(error.message); }
          });
          const cancel = document.createElement('button');
          cancel.type = 'button';
          cancel.className = 'button button-outline';
          cancel.textContent = 'Cancelar reserva de teste';
          const current = todayInSaoPaulo();
          cancel.disabled = booking.date < current.date ||
            (booking.date === current.date && booking.time <= current.time);
          if (cancel.disabled) cancel.title = 'O horário da reserva já passou.';
          cancel.addEventListener('click', async () => {
            if (booking.status !== 'reserved') return;
            const now = todayInSaoPaulo();
            if (booking.date < now.date || (booking.date === now.date && booking.time <= now.time)) return;
            cancel.disabled = true;
            cancel.textContent = 'Cancelando reserva de teste...';
            try {
              await agenda.updateAsync(booking.id, 'canceled');
              if (typeof window.showToast === 'function') {
                window.showToast(agenda.isConnected()
                  ? 'Reserva cancelada na Agenda_MVP. O painel será atualizado.'
                  : 'Reserva de teste cancelada. O painel foi atualizado neste navegador.');
              }
            } catch (err) {
              cancel.disabled = false;
              cancel.textContent = 'Cancelar reserva';
              if (typeof window.showToast === 'function') {
                window.showToast('Erro ao cancelar: ' + err.message);
              }
            }
          });
          if (!agenda.isConnected()) card.appendChild(simulate);
          card.appendChild(cancel);
        } else if (booking.status === 'completed' && !booking.rating) {
          card.classList.add('booking-record--rating');
          const form = document.createElement('form');
          form.className = 'rating-form';
          const fieldset = document.createElement('fieldset');
          fieldset.className = 'star-rating';
          const legend = document.createElement('legend');
          legend.textContent = 'Avalie o atendimento concluído';
          const choices = document.createElement('div');
          choices.className = 'star-rating-choices';
          const inputs = [];
          const stars = [];
          const ratingName = 'rating-' + booking.id;
          for (let score = 1; score <= 5; score += 1) {
            const option = document.createElement('label');
            option.className = 'star-rating-option';
            const input = document.createElement('input');
            input.type = 'radio';
            input.name = ratingName;
            input.value = String(score);
            input.required = score === 1;
            input.setAttribute('aria-label', score + ' de 5 estrelas');
            const star = document.createElement('span');
            star.className = 'star-rating-icon';
            star.textContent = '☆';
            star.setAttribute('aria-hidden', 'true');
            option.append(input, star);
            choices.appendChild(option);
            inputs.push(input);
            stars.push(star);
          }
          const paintStars = (score) => stars.forEach((star, index) => {
            star.textContent = index < score ? '★' : '☆';
          });
          choices.addEventListener('change', () => {
            paintStars(Number(inputs.find((input) => input.checked)?.value || 0));
          });
          choices.addEventListener('pointerover', (event) => {
            const hovered = event.target.closest('.star-rating-option');
            if (hovered && choices.contains(hovered)) paintStars(Number(hovered.querySelector('input').value));
          });
          choices.addEventListener('pointerleave', () => {
            paintStars(Number(inputs.find((input) => input.checked)?.value || 0));
          });
          fieldset.append(legend, choices);
          const commentLabel = document.createElement('label');
          commentLabel.textContent = 'Comentário (opcional)';
          const comment = document.createElement('textarea');
          comment.maxLength = 500;
          comment.placeholder = 'Conte como foi o atendimento, se quiser.';
          commentLabel.appendChild(comment);
          const button = document.createElement('button');
          button.type = 'submit';
          button.className = 'button button-primary';
          button.textContent = 'Enviar avaliação de teste';
          form.append(fieldset, commentLabel, button);
          form.addEventListener('submit', async (event) => {
            event.preventDefault();
            const selected = inputs.find((input) => input.checked);
            if (booking.status !== 'completed' || booking.rating || !selected) return;
            try {
              await agenda.rateAsync(booking.id, { score: Number(selected.value), comment: comment.value.trim() });
            } catch (error) { window.showToast?.(error.message); }
          });
          card.appendChild(form);
        } else if (booking.status === 'completed') {
          const rating = document.createElement('div');
          rating.className = 'submitted-rating';
          const title = document.createElement('strong');
          title.textContent = 'Sua avaliação de teste';
          const stars = document.createElement('span');
          stars.className = 'submitted-rating-stars';
          const score = Math.max(1, Math.min(5, Number(booking.rating.score) || 1));
          stars.textContent = '★'.repeat(score) + '☆'.repeat(5 - score);
          stars.setAttribute('role', 'img');
          stars.setAttribute('aria-label', 'Nota: ' + score + ' de 5 estrelas');
          rating.append(title, stars);
          if (booking.rating.comment) {
            const comment = document.createElement('p');
            comment.textContent = booking.rating.comment;
            comment.dataset.noTranslate = '';
            rating.appendChild(comment);
          }
          card.appendChild(rating);
        }
        list.appendChild(card);
      });
    if (!bookings.some((booking) => booking.rating)) appendReviewExample(list);
  }

  function selection() {
    const calendar = $('#calendar-section');
    return {
      date: calendar.dataset.selectedDate,
      professional: calendar.dataset.professional,
      time: $('#booking-summary').dataset.selectedTime
    };
  }

  function bookingError(message) {
    const error = $('#booking-error');
    error.textContent = message || '';
    error.hidden = !message;
    $('#confirm-booking').disabled = Boolean(message);
  }

  function validation() {
    const chosen = selection();
    if (!chosen.date || !chosen.time || !names[chosen.professional]) return 'Selecione um horário disponível.';
    if (!agenda.slots(chosen.date, chosen.professional).includes(chosen.time))
      return chosen.professional === 'claudio'
        ? 'Escolha um dia útil e um horário futuro disponível.'
        : 'Escolha um dia útil e um horário futuro disponível.';
    const now = todayInSaoPaulo();
    if (chosen.date < now.date || (chosen.date === now.date && chosen.time <= now.time))
      return 'Este horário já passou. Escolha um horário futuro.';
    if (agenda.occupied(chosen.date, chosen.time, chosen.professional))
      return 'Esse horário já foi reservado. Escolha outro.';
    if (countForWeek(chosen.date) >= LIMIT)
      return 'Você já tem duas massagens reservadas ou concluídas nesta semana. Não é possível agendar uma terceira.';
    return '';
  }

  $('#review-booking').addEventListener('click', () => bookingError(validation()));
  // Capture before the original confirmation handler. Block only invalid reservations;
  // successful ones continue into its existing visual confirmation.
  $('#confirm-booking').addEventListener('click', async (event) => {
    // Control the confirmation flow after the local demonstration agenda accepts the booking.
    event.stopImmediatePropagation();
    event.preventDefault();

    const error = validation();
    if (error) {
      bookingError(error);
      return;
    }

    const confirmBtn = $('#confirm-booking');
    const originalText = confirmBtn.textContent;
    confirmBtn.disabled = true;
    confirmBtn.textContent = 'Verificando horário...';

    const chosen = selection();
    try {
      if (typeof agenda.reserveAsync === 'function') {
        await agenda.reserveAsync(chosen);
      } else {
        agenda.reserve(chosen);
      }

      // Show confirmation only after the demonstration agenda accepts the booking.
      $('#review-state').hidden = true;
      $('#success-state').hidden = false;
      window.dispatchEvent(new CustomEvent('selena-booking-confirmed',{detail:chosen}));
      const message = $('#success-message');
      if (message) {
        message.textContent = 'Reserva de teste confirmada com ' + names[chosen.professional] + ', em ' +
          longDate(chosen.date) + ', às ' + chosen.time +
          (agenda.isSharedSchedule?.(chosen.date, chosen.professional)
            ? '. Registrada na Agenda_MVP para o painel profissional.'
            : '. O painel do profissional foi atualizado neste navegador.');
      }
      $('#finish-booking')?.focus();
    } catch (err) {
      bookingError(err.message || 'Erro ao salvar a reserva de teste.');
    } finally {
      confirmBtn.disabled = false;
      confirmBtn.textContent = originalText;
    }
  }, true);

  document.addEventListener('click', (event) => {
    if (event.target.closest('.calendar-day, .professional-card, #next-month, #previous-month, #change-professional')) {
      queueMicrotask(() => updateCounter($('#calendar-section').dataset.selectedDate || todayInSaoPaulo().date));
    }
  });
  window.addEventListener('selena-demo-agenda', refresh);
  refresh();
})();
